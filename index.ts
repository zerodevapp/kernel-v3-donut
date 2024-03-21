import "dotenv/config";
import {
  KernelV3ExecuteAbi,
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { privateKeyToAccount } from "viem/accounts";
import {
  Hex,
  createPublicClient,
  getAbiItem,
  http,
  toFunctionSelector,
  zeroAddress,
} from "viem";
import { sepolia } from "viem/chains";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { signerToDonutValidator } from "./toDonutValidator";

const DONUT_VALIDATOR_ADDRESS = "0xC26abD34b53C6E61ec8CbE34b841228E04CfFA62";
if (
  !process.env.BUNDLER_RPC ||
  !process.env.PAYMASTER_RPC ||
  !process.env.PRIVATE_KEY ||
  !DONUT_VALIDATOR_ADDRESS
) {
  throw new Error(
    "BUNDLER_RPC or PAYMASTER_RPC or PRIVATE_KEY or DONUT_VALIDATOR_ADDRESS is not set"
  );
}
const privateKey = process.env.PRIVATE_KEY as Hex;

const publicClient = createPublicClient({
  transport: http(process.env.BUNDLER_RPC),
  chain: sepolia,
});
const getEnableSig = async () => {
  const signer = privateKeyToAccount(privateKey);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
  const donutValidator = await signerToDonutValidator(publicClient, {
    signer,
    donutLimit: BigInt(1000000000000000000),
    validatorAddress: DONUT_VALIDATOR_ADDRESS,
  });
  const account = await createKernelAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    plugins: {
      sudo: ecdsaValidator,
      regular: donutValidator,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      executorData: {
        selector: toFunctionSelector(
          getAbiItem({ abi: KernelV3ExecuteAbi, name: "execute" })
        ),
        executor: zeroAddress,
      },
    },
  });
  const accountAddress = account.address;
  console.log("accountAddress: ", accountAddress);

  const enableSignature =
    await account.kernelPluginManager.getPluginEnableSignature(accountAddress);
  console.log("enableSignature: ", enableSignature);
};

getEnableSig();
