import { ServiceClient } from "nodecg-io-core/extension/types";
import { success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ReadLine } from "readline";
import SerialPort = require("serialport"); // This is neccesary, because serialport only likes require!
// This is neccesary because serialport does not work with import...
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Readline = require("@serialport/parser-readline");

export interface DeviceInfo {
    port: string;
    manucaturer: string;
    serialNumber: string;
    pnpId: string;
}

interface Protocoll {
    delimiter: string;
    encoding: string;
}

export interface SerialServiceConfig {
    device: DeviceInfo;
    connection: SerialPort.OpenOptions;
    protocoll: Protocoll;
}

export class SerialServiceClient implements ServiceClient<SerialPort> {
    private serialPort: SerialPort;
    private parser: ReadLine;
    constructor(settings: SerialServiceConfig) {
        SerialServiceClient.inferPort(settings.device).then((port) => {
            if (!port.failed) {
                this.serialPort = new SerialPort(port.result, settings.connection);
                this.parser = this.serialPort.pipe(new Readline(settings.protocoll));
            }
        });
    }

    getNativeClient(): SerialPort {
        return this.serialPort;
    }

    static async inferPort(deviceInfo: DeviceInfo): Promise<Result<string>> {
        const result = [];
        const devices = await SerialPort.list();
        if ("port" in deviceInfo) {
            result.push(deviceInfo.port);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            devices.forEach((element: any) => {
                if ("pnpId" in deviceInfo && "pnpId" in element && element.pnpId === deviceInfo["pnpId"]) {
                    result.push(element["path"]);
                } else if (
                    "manufacturer" in deviceInfo &&
                    "serialNumber" in deviceInfo &&
                    element.manufacturer === deviceInfo["manufacturer"] &&
                    element.serialNumber === deviceInfo["serialNumber"]
                ) {
                    result.push(element["path"]);
                }
            });
        }

        // Check if result isn't empty or ambiguous
        if (result.length < 1) {
            return error("No device matched the provided criteria.");
        } else if (result.length > 1) {
            return error("The provided criteria were abiguous.");
        } else {
            return success(result[0]);
        }
    }

    close(): void {
        this.serialPort.close();
    }

    send(payload: string): Result<string> {
        let res = success("OK") as Result<string>;
        this.serialPort.write(payload, (err) => {
            if (err) {
                res = error(err);
            }
        });
        return res;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onData(callback: (...args: any[]) => void): void {
        this.parser.on("data", callback);
    }
}
