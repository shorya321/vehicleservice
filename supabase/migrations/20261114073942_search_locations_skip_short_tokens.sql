-- Multi-word searches looked up every word on its own. Words under 3 letters
-- ("al", "la", "jw") matched tens of thousands of names, which made search slow
-- (about 2.5 s for "burj al arab") and padded the list with unrelated places.
-- Only the per-word candidate lookup skips them; the full phrase, aliases and
-- the all-words scoring still use every word.
-- Old definition kept in public.backup_fn_search_locations_20261114.
do $$
declare d text; d2 text;
begin
  d := pg_get_functiondef('public.search_locations(text,integer)'::regprocedure);
  d2 := replace(d,
    'unnest(CASE WHEN is_multi_word THEN query_tokens ELSE ARRAY[]::TEXT[] END) t',
    'unnest(CASE WHEN is_multi_word THEN ARRAY(SELECT tk FROM unnest(query_tokens) tk WHERE length(tk) >= 3) ELSE ARRAY[]::TEXT[] END) t');
  if d2 = d then
    raise exception 'search_locations: token lookup line not found, nothing changed';
  end if;
  execute d2;
end $$;
