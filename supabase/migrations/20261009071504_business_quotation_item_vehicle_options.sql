-- Extra vehicles offered on a quotation trip. The trip's own vehicle_type_id stays the
-- main (quoted) vehicle and drives the totals; these rows are the alternatives the
-- customer may choose instead. A trip with no rows here behaves exactly as before.
create table public.business_quotation_item_vehicle_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.business_quotation_items(id) on delete cascade,
  vehicle_type_id uuid not null references public.vehicle_types(id),
  net_base_price_aed numeric(12,2) not null,
  net_total_aed numeric(12,2) not null,
  sell_total_aed numeric(12,2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bqivo_amounts check (
    net_base_price_aed >= 0 and net_total_aed >= 0 and sell_total_aed >= 0
  ),
  constraint bqivo_unique unique (item_id, vehicle_type_id)
);

create index idx_bqivo_item_id on public.business_quotation_item_vehicle_options(item_id);
create index idx_bqivo_vehicle_type_id on public.business_quotation_item_vehicle_options(vehicle_type_id);

alter table public.business_quotation_item_vehicle_options enable row level security;

-- Same rule as business_quotation_item_addons: owner, or the member who created the quotation.
create policy "Business members manage permitted quotation vehicle options"
  on public.business_quotation_item_vehicle_options
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.business_quotation_items i
      join public.business_quotations q on q.id = i.quotation_id
      join public.business_users bu on bu.business_account_id = q.business_account_id
      where i.id = business_quotation_item_vehicle_options.item_id
        and bu.auth_user_id = (select auth.uid())
        and bu.is_active
        and (bu.role = 'owner' or q.created_by_user_id = bu.id)
    )
  )
  with check (
    exists (
      select 1
      from public.business_quotation_items i
      join public.business_quotations q on q.id = i.quotation_id
      join public.business_users bu on bu.business_account_id = q.business_account_id
      where i.id = business_quotation_item_vehicle_options.item_id
        and bu.auth_user_id = (select auth.uid())
        and bu.is_active
        and (bu.role = 'owner' or q.created_by_user_id = bu.id)
    )
  );

revoke all on public.business_quotation_item_vehicle_options from anon;

-- Swap a trip's main vehicle with one of its offered options, atomically, just before
-- conversion. The old main vehicle becomes an option so nothing the customer saw is lost.
create or replace function public.swap_quotation_item_vehicle(
  p_item_id uuid,
  p_vehicle_type_id uuid
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item public.business_quotation_items%rowtype;
  v_opt public.business_quotation_item_vehicle_options%rowtype;
begin
  select * into v_item
  from public.business_quotation_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Quotation trip not found';
  end if;

  if v_item.converted_booking_id is not null then
    raise exception 'This trip has already been booked';
  end if;

  if v_item.vehicle_type_id = p_vehicle_type_id then
    return;
  end if;

  select * into v_opt
  from public.business_quotation_item_vehicle_options
  where item_id = p_item_id and vehicle_type_id = p_vehicle_type_id
  for update;

  if not found then
    raise exception 'That vehicle is not offered on this trip';
  end if;

  update public.business_quotation_item_vehicle_options
  set vehicle_type_id = v_item.vehicle_type_id,
      net_base_price_aed = v_item.net_base_price_aed,
      net_total_aed = v_item.net_total_aed,
      sell_total_aed = v_item.sell_total_aed
  where id = v_opt.id;

  update public.business_quotation_items
  set vehicle_type_id = v_opt.vehicle_type_id,
      net_base_price_aed = v_opt.net_base_price_aed,
      net_total_aed = round(v_opt.net_base_price_aed + v_item.net_addons_price_aed, 2),
      sell_total_aed = v_opt.sell_total_aed
  where id = p_item_id;
end;
$$;

revoke execute on function public.swap_quotation_item_vehicle(uuid, uuid) from public, anon, authenticated;
grant execute on function public.swap_quotation_item_vehicle(uuid, uuid) to service_role;
