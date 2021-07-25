import { ServiceManager } from "../serviceManager";
import { MockNodeCG } from "./mocks";
import { Service } from "../service";

const testService: Service<never, never> = {
    serviceType: "test",
    validateConfig: jest.fn(),
    createClient: jest.fn(),
    stopClient: jest.fn(),
    reCreateClientToRemoveHandlers: false,
    requiresNoConfig: false,
};

describe("ServiceManager", () => {
    test("should start with no services", () => {
        const serviceManager = new ServiceManager(new MockNodeCG("nodecg-io-core"));
        expect(serviceManager.getServices().length).toBe(0);
    });

    test("should return all registered services", () => {
        const serviceManager = new ServiceManager(new MockNodeCG("nodecg-io-core"));
        serviceManager.registerService(testService);

        // Make sure that the freshly registered service is also in the service list.
        expect(serviceManager.getServices().length).toBe(1);
        expect(serviceManager.getServices()[0]).toStrictEqual(testService);
    });

    test("getService should return a error if service is not registered", () => {
        const serviceManager = new ServiceManager(new MockNodeCG("nodecg-io-core"));

        const result = serviceManager.getService("someInvalidServiceType");
        expect(result.failed).toBe(true);
    });

    test("getService should return success if service is registered", () => {
        const serviceManager = new ServiceManager(new MockNodeCG("nodecg-io-core"));
        serviceManager.registerService(testService);

        const result = serviceManager.getService(testService.serviceType);
        expect(result.failed).toBe(false);
        if (result.failed === false) {
            expect(result.result).toStrictEqual(testService);
        }
    });
});
