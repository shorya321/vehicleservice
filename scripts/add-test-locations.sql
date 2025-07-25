-- Add popular Indian cities and airports for testing
INSERT INTO locations (name, type, city, state, country_code, code, is_active) VALUES
-- Delhi/NCR
('Indira Gandhi International Airport', 'airport', 'New Delhi', 'Delhi', 'IN', 'DEL', true),
('Delhi Railway Station', 'station', 'New Delhi', 'Delhi', 'IN', NULL, true),
('Connaught Place', 'city', 'New Delhi', 'Delhi', 'IN', NULL, true),
('Gurgaon', 'city', 'Gurgaon', 'Haryana', 'IN', NULL, true),

-- Mumbai
('Chhatrapati Shivaji International Airport', 'airport', 'Mumbai', 'Maharashtra', 'IN', 'BOM', true),
('Mumbai Central Railway Station', 'station', 'Mumbai', 'Maharashtra', 'IN', NULL, true),
('Bandra', 'city', 'Mumbai', 'Maharashtra', 'IN', NULL, true),
('Andheri', 'city', 'Mumbai', 'Maharashtra', 'IN', NULL, true),

-- Bangalore
('Kempegowda International Airport', 'airport', 'Bangalore', 'Karnataka', 'IN', 'BLR', true),
('Bangalore City Railway Station', 'station', 'Bangalore', 'Karnataka', 'IN', NULL, true),
('Electronic City', 'city', 'Bangalore', 'Karnataka', 'IN', NULL, true),

-- Chennai
('Chennai International Airport', 'airport', 'Chennai', 'Tamil Nadu', 'IN', 'MAA', true),
('Chennai Central Railway Station', 'station', 'Chennai', 'Tamil Nadu', 'IN', NULL, true),

-- Kolkata
('Netaji Subhas Chandra Bose International Airport', 'airport', 'Kolkata', 'West Bengal', 'IN', 'CCU', true),
('Howrah Railway Station', 'station', 'Kolkata', 'West Bengal', 'IN', NULL, true),

-- Hyderabad
('Rajiv Gandhi International Airport', 'airport', 'Hyderabad', 'Telangana', 'IN', 'HYD', true),
('Secunderabad Railway Station', 'station', 'Hyderabad', 'Telangana', 'IN', NULL, true),

-- Pune
('Pune Airport', 'airport', 'Pune', 'Maharashtra', 'IN', 'PNQ', true),
('Pune Railway Station', 'station', 'Pune', 'Maharashtra', 'IN', NULL, true),

-- Jaipur
('Jaipur International Airport', 'airport', 'Jaipur', 'Rajasthan', 'IN', 'JAI', true),
('Jaipur Railway Station', 'station', 'Jaipur', 'Rajasthan', 'IN', NULL, true),

-- Goa
('Goa International Airport', 'airport', 'Goa', 'Goa', 'IN', 'GOI', true),
('Madgaon Railway Station', 'station', 'Goa', 'Goa', 'IN', NULL, true),

-- Ahmedabad
('Sardar Vallabhbhai Patel International Airport', 'airport', 'Ahmedabad', 'Gujarat', 'IN', 'AMD', true),
('Ahmedabad Railway Station', 'station', 'Ahmedabad', 'Gujarat', 'IN', NULL, true)
ON CONFLICT (name) DO NOTHING;