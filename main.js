// Thermostat example (figure 15)

[
  {id: 'degrees Celsius', type: 'unit', name: 'degrees Celsius'},

  {id: 'room temperature', type: 'stock', name: 'room temperature', initialValue: 10, unit: 'degrees Celsius'},

  {id: 'furnace', type: 'boundary'},
  {id: 'heat from furnace', type: 'flow', name: 'heat from furnace', from: 'furnace', to: 'room temperature'},

  {id: 'outside', type: 'boundary'},
  {id: 'heat to outside', type: 'flow', name: 'heat to outside', from: 'room temperature', to: 'outside'},

  {id: 'thermostat setting', type: 'parameter', name: 'thermostat setting', value: 18, unit: 'degrees Celsius'},
  {id: 'outside temperature', type: 'parameter', name: 'outside temperature', value: 10, unit: 'degrees Celsius'}, // TODO: Value needs to vary over time

  {
    id: 'discrepancy between desired and actual room temperatures',
    type: 'rule',
    name: 'discrepancy between desired and actual room temperatures',
    input: [
      'room temperature',
      'thermostat setting',
    ],
    output: ['heat from furnace'],
  },
  {
    id: 'discrepancy between inside and outside temperatures',
    type: 'rule',
    name: 'discrepancy between inside and outside temperatures',
    input: [
      'room temperature',
      'outside temperature',
    ],
    output: ['heat to outside'],
  },
]

/*
  * Figures on pg 37
  * Model on pg 197
  * Stock: room temperature(t) = room temperature(t - dt) + (heat from furnace - heat to outside) x dt
  * Initial stock value: room temperature = 10 degrees C for cold-room warming; 18 degrees C for warm-room cooling
  * t = hours
  * dt = 1 hour
  * Run time = 8 hours and 24 hours
  * Inflow: heat from furnace = minimum of discrepancy between desired and actual room temperature or 5
  * Outflow: heat to outside =
  *   discrepancy between inside and outside temperature x 10% ... for "normal" house;
  *   discrepancy between inside and outside temperature x 30% ... for very leaky house
  * Converters: thermostat setting = 18 degrees C
  *   discrepancy between desired and actual room temperature = maximum of (thermostat setting - room temperature) and 0
  *   discrepancy between inside and outside temperature = room temperature - 10 degrees C ... for constant outside temperature (Figures 16-18);
  *     room temperature - 24-hour outside temp...for full day-and-night cycle (Figures 19 and 20)
*/