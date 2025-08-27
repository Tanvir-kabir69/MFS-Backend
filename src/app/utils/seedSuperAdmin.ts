import bcryptjs from "bcryptjs";
import { envVars } from "../config/env";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import mongoose from "mongoose";
import { Wallet } from "../modules/wallet/walletSchemaModel";

// export const seedSuperAdmin = async () => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const isSuperAdminExist = await User.findOne({
//       email: envVars.SUPER_ADMIN_EMAIL,
//     }).session(session);

//     if (isSuperAdminExist) {
//       console.log("Super Admin Already Exists!");
//       return;
//     }

//     console.log("Trying to create Super Admin...");

//     const hashedPassword = await bcryptjs.hash(
//       envVars.SUPER_ADMIN_PASSWORD,
//       Number(envVars.BCRYPT_SALT_ROUND)
//     );

//     const authProvider: IAuthProvider = {
//       provider: "credentials",
//       providerId: envVars.SUPER_ADMIN_EMAIL,
//     };

//     const payload: IUser = {
//       name: "Super admin",
//       role: Role.SUPER_ADMIN,
//       email: envVars.SUPER_ADMIN_EMAIL,
//       phone: envVars.SUPER_ADMIN_PHONE,
//       password: hashedPassword,
//       isVerified: true,
//       auths: [authProvider],
//     };

//     // const superadmin = await User.create(payload)

//     const [superAdmin] = await User.create([payload], {
//       session,
//     });

//     const [superWallet] = await Wallet.create(
//       [
//         {
//           user_id: superAdmin._id,
//           amount: Number(envVars.WALLET_SUPER_AMOUNT),
//         },
//       ],
//       {
//         session,
//       }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     console.log("Super Admin and Super Wallet Created Successfuly! \n");
//     console.log({ superAdmin, superWallet });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.log(error);
//   }
// };

export const seedSuperAdmin = async () => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },   // ✅ safer read isolation
      writeConcern: { w: "majority" },      // ✅ ensure replication safety
    });

    // 🔍 Check if super admin already exists
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    }).session(session);

    if (isSuperAdminExist) {
      console.log("⚠️ Super Admin already exists, skipping creation.");
      await session.abortTransaction();  // ✅ abort to be safe
      return;
    }

    console.log("🚀 Creating Super Admin...");

    // 🔑 Hash password
    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    // 🪪 Auth provider
    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVars.SUPER_ADMIN_EMAIL,
    };

    // 👤 User payload
    const payload: IUser = {
      name: "Super admin",
      role: Role.SUPER_ADMIN,
      email: envVars.SUPER_ADMIN_EMAIL,
      phone: envVars.SUPER_ADMIN_PHONE,
      password: hashedPassword,
      isVerified: true,
      auths: [authProvider],
    };

    // 👤 Create Super Admin
    const [superAdmin] = await User.create([payload], { session });

    // 👛 Create Wallet for Super Admin
    const [superWallet] = await Wallet.create(
      [
        {
          user_id: superAdmin._id,
          amount: Number(envVars.WALLET_SUPER_AMOUNT),
        },
      ],
      { session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();

    console.log("✅ Super Admin and Wallet created successfully!");
    console.log({ superAdmin, superWallet });

  } catch (error) {
    // ❌ Rollback on failure
    await session.abortTransaction();
    console.error("❌ Transaction aborted due to error:", error);

  } finally {
    // 🛑 Always close session
    session.endSession();
  }
};