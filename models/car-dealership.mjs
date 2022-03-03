import { assert } from '../utils.mjs';

/*
 * Figures on pg 52
 * Model on pg 199
 * 
 * Business Inventory — for Figures 29 – 36
 * Stock: inventory of cars on the lot(t) = inventory of cars on the lot(t – dt) + (deliveries – sales) x dt
 * Initial stock values: inventory of cars on the lot = 200 cars
 * t = days
 * dt = 1 day
 * Run time = 100 days
 * Inflows: deliveries = 20 ... for time 0 to 5; 
 *                       orders to factory (t – delivery delay) ... for time 6 to 100
 * Outflows: sales = minimum of inventory of cars on the lot or customer demand
 * Converters: customer demand = 20 cars per day ... for time 0 to 25;
 *                               22 cars per day ... for time 26 to 100
 * perceived sales = sales averaged over perception delay (i.e. sales smoothed over perception delay)
 * desired inventory = perceived sales x 10
 * discrepancy = desired inventory – inventory of cars on the lot
 * orders to factory = maximum of (perceived sales + discrepancy) or 0 ... for Figure 32;
 *      maximum of (perceived sales + discrepancy * order damping) or 0 ... for Figures 34-36
 * 
 * Delays, Figure 30:
 * perception delay = 0
 * order damping = 1 (book called this "response delay")
 * delivery delay = 0 
 * 
 * Delays, Figure 32:
 * perception delay = 5 days
 * order damping = 1/3
 * delivery delay = 5 days
 * 
 * Delays, Figure 34:
 * perception delay = 2 days
 * order damping = 1/3
 * delivery delay = 5 days
 * 
 * Delays, Figure 35:
 * perception delay = 5 days
 * order damping = 1/2
 * delivery delay = 5 days
 * 
 * Delays, Figure 36:
 * perception delay = 5 days
 * order damping = 1/6
 * delivery delay = 5 days
*/

const spec = [
    { id: 'cars', type: 'unit', name: 'cars' },
    { id: 'days', type: 'unit', name: 'days' },

    {
        id: 'customer demand',
        type: 'parameter',
        name: 'customer demand',
        value: (t) => (t <= 25 ? 20 : 22),
        unit: 'cars'
    },

    {
        id: 'perception delay',
        type: 'parameter',
        name: 'perception delay',
        value: 5,
        unit: 'days'
    },

    {
        id: 'order damping',
        type: 'parameter',
        name: 'order damping',
        value: 1/3,
        //unit: 'dimensionless'
    },

    {
        id: 'delivery delay',
        type: 'parameter',
        name: 'delivery delay',
        value: 5,
        unit: 'days'
    },
    {
        id: 'inventory',
        type: 'stock',
        name: 'car inventory on lot',
        unit: 'cars',
        initialValue: 200,
    },

    { 
        id: 'deliveries',
        type: 'flow',
        name: 'deliveries',
        from: 'factory',
        to: 'inventory',
        inputs: [
            ['orders'],
            'delivery delay',
            'currTime'
        ],
        logic: (orderRecords, deliveryDelay, currTime) =>
            // orders to factory (t – delivery delay) ... for time 6 to 100
            currTime <= deliveryDelay
            ? 20
            : orderRecords(currTime - deliveryDelay)
    },

    {
        id: 'sales',
        type: 'flow',
        name: 'car sales',
        from: 'inventory',
        to: 'customers',
        inputs: [
            'customer demand',
            'inventory',
        ],
        logic: (customerDemand, inventory) =>
            Math.min(customerDemand, inventory)
    },

    {
        id: 'customers',
        type: 'boundary',
        unit: 'cars'
    },

    {
        id: 'factory',
        type: 'boundary',
        unit: 'cars'
    },

    {
        id: 'perceived sales',
        type: 'converter',
        name: 'perceived sales',
        inputs: [
            ["sales"],
            "perception delay",
            "currTime"
        ],
        logic: (salesRecords, perceptionDelay) => {
            // TODO(adam): Why did we need to also subtract `deliveryDelay` in
            //   our original implementation but not here?
            const perceivedRecords = 
                salesRecords(
                    currTime - 1 - perceptionDelay,
                    currTime - 1
                )
            assert(perceptionDelay === perceivedRecords.length)
            const sum = perceivedRecords.reduce((x, y) => x + y, 0)
            return sum / perceptionDelay
        }
    },

    {
        id: 'desired inventory',
        type: 'converter',
        name: 'desired inventory',
        inputs: [
            "perceived sales"
        ],
        logic: perceivedSales => 10 * perceivedSales
    },

    {
        id: 'inventory discrepancy',
        type: 'converter',
        name: 'inventory discrepancy',
        inputs: [
            'inventory',
            'desired inventory'
        ],
        logic: (inventory, desiredInventory) => {
            const discrepancy = desiredInventory - inventory
            return discrepancy
        }
    },

    {
        id: 'orders',
        type: 'converter',
        name: 'orders to factory',
        inputs: [
            'inventory discrepancy',
            'order damping',
            'perceived sales'
        ],
        logic: (inventoryDiscrepancy, orderDamping, perceivedSales) => 
            Math.max(
                0,
                perceivedSales + inventoryDiscrepancy * orderDamping
            )
    }
]

export { spec }