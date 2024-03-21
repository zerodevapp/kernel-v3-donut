import "dotenv/config";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { privateKeyToAccount } from "viem/accounts";
import { Hex, createPublicClient, http, zeroAddress } from "viem";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { signerToDonutValidator } from "./toDonutValidator";

// Make sure to set the DONUT_VALIDATOR_ADDRESS variable
const DONUT_VALIDATOR_ADDRESS = zeroAddress;
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
});
const getEnableSig = async () => {
  const signer = privateKeyToAccount(privateKey);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
  const donutValidator = await signerToDonutValidator(publicClient, {
    signer,
    validatorAddress: DONUT_VALIDATOR_ADDRESS,
  });
  const account = await createKernelAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    plugins: {
      sudo: ecdsaValidator,
      regular: donutValidator,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    },
  });
  const accountAddress = account.address;
  console.log("accountAddress: ", accountAddress);

  const enableSignature =
    await account.kernelPluginManager.getPluginEnableSignature(accountAddress);
  console.log("enableSignature: ", enableSignature);
};

getEnableSig();
