import "dotenv/config";
import { ConnectionPool } from "mssql";
import { AccesoryStock } from "./models/AccesoryStock";
import { AccessoryDNS } from "./models/AccessoryDNS";
import { MaintenanceDNS } from "./models/MantenanceDNS";
import { getDNSConnection, getLoadDBName, getLoadSSHConnection, getStoreDBName, getStoreSSHConnection } from "./utils";


const main = async () => {
    try {
        console.log(`Starting syncronization in mode: ${process.env.SYNC_ENV} ✨`);
        console.log(`Date: ${new Date()}`);

        const DNSConnection = await getDNSConnection();

        const accessories = await getAccesoriesFromDNS(DNSConnection);
        await synchronizeAccessories(accessories);

        //const maintenances = await getMaintenancesFromDNS(DNSConnection);
        //await synchronizeMaintenances(maintenances);

    } catch (error) {
        console.error(`The process can't be completed ${error}`);
    }

    process.exit(0);
}

const getAccesoriesFromDNS = async (DNSConnection: ConnectionPool): Promise<AccessoryDNS[]> => {
    const result = await DNSConnection.query(`SELECT * FROM MAZKO.dbo.v_accesorios_stock`);
    const data = result.recordset;

    const accessoriesKey: { [key: string]: AccessoryDNS } = {};

    data.map((item) => {
        const codigo = item.codigo;

        if (accessoriesKey[codigo]) {
            accessoriesKey[codigo].stock += item.stock;
            return;
        }

        accessoriesKey[codigo] = {
            bodega: item.bodega,
            desBodega: item.des_bodega,
            codigo: item.codigo,
            codigoStock: parseAccesoryCode(item.codigo),
            descripcion: item.descripcion,
            valorUnitarioSinIva: item.valor_unitario_sin_iva,
            valorConIva: item.valorconiva,
            stock: item.stock
        }
    });

    const accessories = Object.values(accessoriesKey).map((item) => item);

    return accessories;
};

const parseAccesoryCode = (codigo: string): string => {
    const reg = /^[a-zA-Z0-9]*-DIS$/;
    if (!reg.test(codigo))
        return codigo;

    return codigo.split("-DSI")[0];
};

const synchronizeAccessories = async (accessories: AccessoryDNS[]) => {
    console.log(`Syncronizing accesories, quantity: ${accessories.length}`);
    const conexion = await getLoadSSHConnection();
    const loadDBName = getLoadDBName();

    for (let accessory of accessories) {
        try {
            console.log(`Processing the accessory: ${accessory.descripcion} - ${accessory.codigoStock}`);

            const [result] = await conexion.promise().query(`SELECT product_id, sku, stock_quantity, min_price, max_price FROM ${loadDBName}.wp_wc_product_meta_lookup WHERE sku = ?`, [accessory.codigoStock]);
            if (!result[0])
                throw new Error(`Item not found in store database: ${accessory.codigoStock}.`);
            
            const [postMetaWP] = await conexion.promise().query(`SELECT * FROM ${loadDBName}.wp_postmeta WHERE meta_key = ? AND meta_value = ?`, ['_sku', accessory.codigoStock]);
            if(!postMetaWP[0])
                throw new Error(`Item not found in wp_postmeta: ${accessory.codigoStock}.`);
            
            console.log(`✅ Updating wp_wc_product_meta_lookup:`)

            const item: AccesoryStock = result[0];
            console.log(`Current stock: ${item.stock_quantity} -> new stock: ${accessory.stock}`);
            console.log(`Current min price: ${item.min_price} -> new min price: ${accessory.valorConIva}`);
            console.log(`Current max price: ${item.max_price} -> new max price: ${accessory.valorConIva}`);

            await conexion.promise().query(`UPDATE ${loadDBName}.wp_wc_product_meta_lookup SET stock_quantity = ?, min_price = ?, max_price = ? WHERE sku = ?`, [accessory.stock, accessory.valorConIva, accessory.valorConIva, accessory.codigoStock]);

            console.log(`✅ Updating wp_postmeta:`);
            const postMeta: PostMetaWP = postMetaWP[0];

            const [resultPostMetas] = await conexion.promise().query(`SELECT * FROM ${loadDBName}.wp_postmeta WHERE post_id = ? AND meta_key IN (?, ?, ?, ?, ?)`, [postMeta.post_id, '_sku', '_stock', '_regular_price', '_price', '_manage_stock']);
            const postMetasWP = resultPostMetas as PostMetaWP[];
            for(let idx = 0; idx < postMetasWP.length; idx++) {
                console.log(`Meta key: ${postMetasWP[idx].meta_key} - Meta Value: ${postMetasWP[idx].meta_value}`);
            }

            await conexion.promise().query(`UPDATE ${loadDBName}.wp_postmeta SET meta_value = ? WHERE meta_key = ? AND post_id = ?`, [accessory.valorConIva, '_regular_price', postMeta.post_id]);
            await conexion.promise().query(`UPDATE ${loadDBName}.wp_postmeta SET meta_value = ? WHERE meta_key = ? AND post_id = ?`, [accessory.valorConIva, '_price', postMeta.post_id]);
            await conexion.promise().query(`UPDATE ${loadDBName}.wp_postmeta SET meta_value = ? WHERE meta_key = ? AND post_id = ?`, [accessory.stock, '_stock', postMeta.post_id]);
            await conexion.promise().query(`UPDATE ${loadDBName}.wp_postmeta SET meta_value = ? WHERE meta_key = ? AND post_id = ?`, ['yes', '_manage_stock', postMeta.post_id]);

        } catch (error) {
            console.info(`The accessory: ${accessory.descripcion} - ${accessory.codigoStock} can't be updated: ${error}`);
        }
    }

    conexion.end();
};

const getMaintenancesFromDNS = async (DNSConnection: ConnectionPool): Promise<MaintenanceDNS[]> => {
    const result = await DNSConnection.query(`SELECT * FROM MAZKO.dbo.v_tall_crmv_planes_mantenimiento`)
    const data = result.recordset;

    const maintenances: MaintenanceDNS[] = data.map((item) => {
        const maintenance: MaintenanceDNS = {
            id: item["id_plan_mantenimiento_enca"],
            modelo: item["modelo"],
            ano: item["ano"],
            descripcion: item["DESCRIPCION"],
            kilometraje: item["kilometraje"],
            notas: item["notas"],
            precio: item["precio"]
        };

        return maintenance
    });

    return maintenances;
};

const synchronizeMaintenances = async (maintenances: MaintenanceDNS[]) => {
    console.log(`Syncronizing maintenances, quantity: ${maintenances.length}`);
    const conexion = await getStoreSSHConnection();
    const storeDBName = getStoreDBName();

    for (let maintenance of maintenances) {
        try {
            console.log(`Processing the maintenance: ${maintenance.descripcion} - ${maintenance.id}`);
            const [result] = await conexion.promise().query(`SELECT id_dns, id, descripcion FROM ${storeDBName}.mantenimiento WHERE id_dns = ?`, [maintenance.id]);

            if (result[0]) {
                const queryString = `UPDATE ${storeDBName}.mantenimiento SET modelo = ?, ano = ?, descripcion = ?, kilometraje = ?, operacion = ?, precio = ? WHERE id_dns = ?`;
                const values = [maintenance.modelo, maintenance.ano, maintenance.descripcion, maintenance.kilometraje, maintenance.notas, maintenance.precio, maintenance.id];

                await conexion.promise().query(queryString, values);
            } else {
                const queryString = `INSERT INTO ${storeDBName}.mantenimiento (modelo, ano, descripcion, kilometraje, operacion, precio, id_dns) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                const values = [maintenance.modelo, maintenance.ano, maintenance.descripcion, maintenance.kilometraje, maintenance.notas, maintenance.precio, maintenance.id];

                await conexion.promise().query(queryString, values);
            }

        } catch (error) {
            console.info(`The maintenance: ${maintenance.descripcion} - ${maintenance.id} can't be updated: ${error}`)
        }

    }

};

main();