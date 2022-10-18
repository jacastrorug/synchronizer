import "dotenv/config";
import * as SSH2 from "ssh2";
import * as MySQL from "mysql2";
import * as MSSQL from "mssql";

import { ForwardConfig } from "../models/ForwardConfig";
import { SSHConnection } from "./sshConnection";
import { Environment } from "../models/Environment";

export const getStoreSSHConnection = async (): Promise<MySQL.Connection> => {

    if (process.env.SYNC_ENV !== Environment.PROD) {
        const sqlStoreConfig: MySQL.ConnectionOptions = {
            host: process.env.DB_STORE_SERVER,
            user: process.env.DB_STORE_USER,
            password: process.env.DB_STORE_PASSWORD,
            database: process.env.DB_STORE_NAME,
        };

        return MySQL.createConnection(sqlStoreConfig);
    }


    const configSSHConnection: SSH2.ConnectConfig = {
        host: process.env.SSH_STORE_HOST,
        port: parseInt(process.env.SSH_STORE_PORT),
        username: process.env.SSH_STORE_USER,
        password: process.env.SSH_STORE_PASSWORD
    };

    const dbConfig: MySQL.ConnectionOptions = {
        host: process.env.DB_SSH_STORE_HOST,
        port: parseInt(process.env.DB_SSH_STORE_PORT),
        user: process.env.DB_SSH_STORE_USER,
        password: process.env.DB_SSH_STORE_PASSWORD,
        database: process.env.DB_SSH_STORE_NAME
    };

    const forwardConfig: ForwardConfig = {
        srcHost: process.env.SSH_STORE_HOST,
        srcPort: parseInt(process.env.SSH_STORE_PORT),
        dstHost: process.env.DB_SSH_STORE_HOST,
        dstPort: parseInt(process.env.DB_SSH_STORE_PORT)
    };

    try {
        const sshConnection: MySQL.Connection = await SSHConnection(configSSHConnection, dbConfig, forwardConfig);

        return sshConnection;
    } catch (error) {
        console.error(error);
        throw new Error('The SSH connection to the STORE fail ❌, please review connection config.');
    }


};

export const getLoadSSHConnection = async (): Promise<MySQL.Connection> => {

    if (process.env.SYNC_ENV !== Environment.PROD) {
        const sqlStoreConfig: MySQL.ConnectionOptions = {
            host: process.env.DB_STOCK_SERVER,
            user: process.env.DB_STOCK_USER,
            password: process.env.DB_STOCK_PASSWORD,
            database: process.env.DB_STOCK_NAME,
        };

        return MySQL.createConnection(sqlStoreConfig);
    }

    const configSSHConnection: SSH2.ConnectConfig = {
        host: process.env.SSH_LOAD_HOST,
        port: parseInt(process.env.SSH_LOAD_PORT),
        username: process.env.SSH_LOAD_USER,
        password: process.env.SSH_LOAD_PASSWORD
    };

    const dbConfig: MySQL.ConnectionOptions = {
        host: process.env.DB_LOAD_HOST,
        port: parseInt(process.env.DB_LOAD_PORT),
        user: process.env.DB_LOAD_USER,
        password: process.env.DB_LOAD_PASSWORD,
        database: process.env.DB_LOAD_NAME
    };

    const forwardConfig: ForwardConfig = {
        srcHost: process.env.SSH_LOAD_HOST,
        srcPort: parseInt(process.env.SSH_LOAD_PORT),
        dstHost: process.env.DB_LOAD_HOST,
        dstPort: parseInt(process.env.DB_LOAD_PORT)
    };

    try {
        const sshConnection: MySQL.Connection = await SSHConnection(configSSHConnection, dbConfig, forwardConfig);

        return sshConnection;
    } catch (error) {
        console.error(error);
        throw Error('The SSH connection to the LOAD fail ❌, please review connection config.');
    }

};

export const getDNSConnection = async (): Promise<MSSQL.ConnectionPool> => {

    const sqlDnsConfig: MSSQL.config = {
        user: process.env.DB_DNS_USER,
        password: process.env.DB_DNS_PASSWORD,
        server: process.env.DB_DNS_SERVER,
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    };


    return MSSQL.connect(sqlDnsConfig);
};

export const getLoadDBName = (): string => {

    if (process.env.SYNC_ENV !== Environment.PROD) {
        return process.env.DB_STOCK_NAME;
    }

    return process.env.DB_LOAD_NAME;
};

export const getStoreDBName = (): string => {

    if (process.env.SYNC_ENV !== Environment.PROD) {
        return process.env.DB_STORE_NAME;
    }

    return process.env.DB_STORE_NAME;
};

