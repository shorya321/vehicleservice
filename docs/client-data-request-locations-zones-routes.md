Hi,

We need some basic data from you to set up the booking system. Right now we need 3 things — your locations, zones, and routes. You can send it in Excel, Google Sheet, or however you like.


## 1. Locations

We need a list of all places where customers get picked up or dropped off.

For each place, we need:

- **Name** — full name of the place (e.g. "Dubai International Airport - Terminal 3")
- **Type** — what kind of place is it? Pick one: Airport, City/Area, Hotel, or Station
- **Address** — street address (helps drivers navigate)
- **City** — which city (e.g. Dubai, Abu Dhabi, Sharjah)
- **Country** — which country (e.g. UAE, Oman)
- **Latitude & Longitude** — GPS coordinates if you have them. If not, no problem — we can look them up from the address
- **Timezone** — only needed if you operate across different timezones. Otherwise we'll set it automatically
- **Pickup allowed?** — can customers be picked up here? (Yes/No)
- **Drop-off allowed?** — can customers be dropped off here? (Yes/No)
- **Active?** — should this place be live on the website right away? (Yes/No)

Make sure to cover all your airports, the city areas you serve, popular hotels, and any train/bus stations or cruise terminals.

If you need other place types beyond Airport, Hotel, City/Area, and Station (like Resort, Mall, or Cruise Terminal), let us know.


## 2. Zones & Pricing

Zones are how pricing works in the system. Let me explain with a quick example so it makes sense.

**What's a zone?**
A zone is a group of locations in the same area. You give each zone one name, and all locations inside it share the same pricing rules.

**Example:**

    Dubai Zone → Dubai Airport, Downtown Dubai, Dubai Marina, JBR, Business Bay
    Abu Dhabi Zone → Abu Dhabi Airport, Yas Island, Saadiyat Island, Corniche
    Sharjah Zone → Sharjah Airport, Sharjah City Centre
    Al Ain Zone → Al Ain city locations

**How pricing connects to zones:**
You set one base price for each zone-to-zone trip. That base price is for a standard Economy Sedan. Bigger and luxury cars are calculated automatically from that base.

So the pricing looks like a simple grid:

    Dubai → Abu Dhabi = 350 AED
    Abu Dhabi → Dubai = 350 AED
    Dubai → Sharjah = 150 AED
    Sharjah → Dubai = 150 AED
    Dubai → Al Ain = 400 AED
    Abu Dhabi → Al Ain = 250 AED

The price can be different in each direction, or the same — up to you.

**What happens with other car types?**
The system takes your base price and adjusts it for each car type. So if your Dubai → Abu Dhabi base is 350 AED:

    Small car (Micro) → ~245 AED (30% cheaper)
    Economy Sedan → 350 AED (this is the base you set)
    Comfort Sedan → ~455 AED (30% more)
    Minivan → ~455 AED
    SUV → ~525 AED (50% more)
    Luxury Sedan → ~700 AED (double)
    Luxury SUV → ~875 AED
    Minibus 7-seat → ~630 AED
    ...up to Minibus 19-seat → ~1,925 AED

You only need to give us the base price. The system does the rest. If any of these ratios don't work for you, we can adjust them.

**What we need from you:**

For zones:
- **Zone name** (e.g. Dubai, Abu Dhabi, Sharjah)
- **Short description** of what the zone covers (optional but helpful)
- **Which locations** from Section 1 go into each zone

For pricing:
- **From zone → To zone = Base price (AED)** for each combination
- Should the price be the same both ways, or different?
- Is AED your currency?


## 3. Routes

A route is a specific trip from one location to another. We need to know which trips you offer.

For each route:
- **From** — starting location (e.g. Dubai Airport)
- **To** — destination (e.g. Downtown Dubai)
- **Distance** — in kilometers (Google Maps estimate is fine)
- **Travel time** — in minutes (again, Google Maps works)
- **Popular?** — is this one of your top trips? We show popular ones on the homepage (pick your top 6 to 10)
- **Active?** — should this route be live right away? (Yes/No)

You don't have to connect every location to every other location — just the ones you actually offer.

If it's easier, you can tell us the rules instead — something like "all airports connect to all hotels and city areas" — and we'll build the routes from there. We can also look up distances and travel times if you don't have them handy.


---

That's it for now. Once we get this, we'll set everything up and come back to you for the remaining details (car types, extras, etc.).

Send it in whatever format works — Excel, Google Sheets, or even just a written list. If you'd rather go through it on a call, that works too.

Let us know if anything isn't clear.

Thanks
