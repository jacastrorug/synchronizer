import "dotenv/config";
import { connect, query, config } from "mssql";
import * as MySQL from "mysql2";

import { AccessoriesDNS } from "./models/AccessoriesDNS";


const sqlDnsConfig: config = {
    user: process.env.DB_DNS_USER,
    password: process.env.DB_DNS_PASSWORD,
    server: process.env.DB_DNS_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const sqlStockConfig: MySQL.ConnectionOptions = {
    host: process.env.DB_STOCK_SERVER,
    user: process.env.DB_STOCK_USER,
    password: process.env.DB_STOCK_PASSWORD,
    database: process.env.DB_STOCK_NAME,
    port: 3306
};

const main = async () => {
    try {

        const conexion2 = MySQL.createPool({
            host: process.env.DB_STOCK_SERVER,
            user: process.env.DB_STOCK_USER,
            password: process.env.DB_STOCK_PASSWORD,
            database: process.env.DB_STOCK_NAME,
        });

        const response = conexion2.query(`SELECT 1 + 1 AS solution;`, [], (error, results) => {
            console.log(error, results);
        });

        // await synchronizeAccessories([], conexion2);
        
        const conexion = MySQL.createConnection(sqlStockConfig);
        conexion.connect();

        await connect(sqlDnsConfig);
        const accessories = await getAccesoriesFromDNS();
        //await synchronizeAccessories(accessories, conexion2);

    } catch (error) {
        console.error(`The process can't be completed ${error}`);
    }

    process.exit(0);
}

const getAccesoriesFromDNS = async (): Promise<AccessoriesDNS[]> => {
    const result = await query(`SELECT * FROM MAZKO.dbo.v_accesorios_stock;`);
    const data = result.recordset;

    const accessoriesKey: { [key: string]: AccessoriesDNS } = {};

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

const synchronizeAccessories = async (accessories: AccessoriesDNS[], conexion: MySQL.Connection) => {
    const response = conexion.query(`SELECT 1 + 1 AS solution;`, [], (error, results) => {
        console.log(error, results);
    });

    for (let accessory of accessories) {
        try {
            console.log(`Processing the accessory: ${accessory.descripcion} - ${accessory.codigoStock}`);

            const response = conexion.query(`SELECT 1 + 1 AS solution;`, [], (error, results) => {
                console.log(error, results);
            });

            break;
        } catch (error) {
            console.error(`The accessory: ${accessory.descripcion} - ${accessory.codigoStock} can't be updated: ${error}`);
        }
    }

    conexion.end();
};


main();