/**
 * Makes that are two words, checked before the one-word list. Anything not
 * listed keeps its full name as the model: "Range Rover" is a model line, and
 * splitting it would print "Range" over "Rover".
 */
const TWO_WORD_MAKES = ['Rolls Royce', 'Land Rover', 'Aston Martin', 'Alfa Romeo']
const ONE_WORD_MAKES = [
  'Audi', 'Bentley', 'BMW', 'Cadillac', 'Chevrolet', 'Chrysler', 'Ferrari', 'Ford', 'Genesis', 'GMC',
  'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Lexus', 'Lincoln', 'Lucid',
  'Maserati', 'Maybach', 'Mercedes', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Porsche', 'Rolls-Royce',
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
]

export function splitVehicleName(name: string): { make: string | null; model: string } {
  const full = name.trim().replace(/\s+/g, ' ')
  const lower = full.toLowerCase()
  const make = [...TWO_WORD_MAKES, ...ONE_WORD_MAKES].find((m) => lower.startsWith(`${m.toLowerCase()} `))
  if (!make) return { make: null, model: full }
  const model = full.slice(make.length).trim()
  return model ? { make: full.slice(0, make.length), model } : { make: null, model: full }
}
