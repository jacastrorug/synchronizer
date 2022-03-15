"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require("dotenv/config");
var mssql_1 = require("mssql");
var MySQL = require("mysql");
var sqlDnsConfig = {
    user: process.env.DB_DNS_USER,
    password: process.env.DB_DNS_PASSWORD,
    server: process.env.DB_DNS_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
var sqlStockConfig = {
    host: process.env.DB_STOCK_SERVER,
    user: process.env.DB_STOCK_USER,
    password: process.env.DB_STOCK_PASSWORD,
    database: process.env.DB_STOCK_NAME,
    port: 3306
};
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var accessories, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, mssql_1.connect)(sqlDnsConfig)];
            case 1:
                _a.sent();
                return [4 /*yield*/, getAccesoriesFromDNS()];
            case 2:
                accessories = _a.sent();
                return [4 /*yield*/, synchronizeAccessories(accessories)];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("The process can't be completed ".concat(error_1));
                return [3 /*break*/, 5];
            case 5:
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };
var getAccesoriesFromDNS = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, data, accessoriesKey, accessories;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, mssql_1.query)("SELECT * FROM MAZKO.dbo.v_accesorios_stock;")];
            case 1:
                result = _a.sent();
                data = result.recordset;
                accessoriesKey = {};
                data.map(function (item) {
                    var codigo = item.codigo;
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
                    };
                });
                accessories = Object.values(accessoriesKey).map(function (item) { return item; });
                return [2 /*return*/, accessories];
        }
    });
}); };
var parseAccesoryCode = function (codigo) {
    var reg = /^[a-zA-Z0-9]*-DIS$/;
    if (!reg.test(codigo))
        return codigo;
    return codigo.split("-DSI")[0];
};
var synchronizeAccessories = function (accessories) { return __awaiter(void 0, void 0, void 0, function () {
    var conexion, _i, accessories_1, accessory, response;
    return __generator(this, function (_a) {
        conexion = MySQL.createConnection(sqlStockConfig);
        conexion.connect({}, function (error, data) {
            console.log(error, data);
        });
        console.log(conexion.state);
        for (_i = 0, accessories_1 = accessories; _i < accessories_1.length; _i++) {
            accessory = accessories_1[_i];
            try {
                console.log("Processing the accessory: ".concat(accessory.descripcion, " - ").concat(accessory.codigoStock));
                response = conexion.query("SELECT 1 + 1 AS solution;", function (error, results, fields) {
                    console.log(error, results, fields);
                });
                break;
            }
            catch (error) {
                console.error("The accessory: ".concat(accessory.descripcion, " - ").concat(accessory.codigoStock, " can't be updated: ").concat(error));
            }
        }
        conexion.end();
        return [2 /*return*/];
    });
}); };
main();
