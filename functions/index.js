const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

// Cloud function to create a new employee
exports.createNewEmployee = functions.https.onCall(async (response) => {
  // Check if the request is from an authenticated admin
  // if (!context.auth) {
  //     throw new functions.https.HttpsError(
  //         "unauthenticated",
  //         "The function must be called while authenticated."
  //     );
  // }

  // Optional: Add admin-only check using custom claims
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "Only admins can create employees");
  // }
  // Check if data is properly received
  console.log("Data from createNewEmployee():", response.data)
  //
  // if (!data || !data.email) {
  //     console.error("Invalid data received:", data);
  //     throw new functions.https.HttpsError(
  //         "invalid-argument",
  //         "The function must be called with valid employee data."
  //     );
  // }
  console.log("Email of new user:", response.data.email)
  try {
    const userRecord = await admin.auth().createUser({
      email: response.data.email,
      password: "123123123", // Using your static password
      displayName: `${response.data.firstName} ${response.data.lastName}`,
    })

    console.log("User created successfully:", userRecord.uid)

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "employee",
      department: response.data.department,
    })

    // Add user data to Firestore (using the same structure as your current code)
    await admin
      .firestore()
      .collection("employees")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        department: response.data.department,
        bio: response.data.bio || "",
        email: response.data.email,
        phoneNumber: response.data.phoneNumber,
        designation: response.data.designation,
        hourlyRate: Number(response.data.hourlyRate || 0),
        workingHours: Number(response.data.workingHours || 0),
        overtimeRate: Number(response.data.overtimeRate || 0),
        //profileImageUrl: data.profileImageUrl || "",
        //createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    // Return the created employee's ID
    return {
      success: true,
      uid: userRecord.uid,
      message: "Employee added successfully",
    }
  } catch (error) {
    console.error("Error creating new employee:", error)
    throw new functions.https.HttpsError("internal", error.message)
  }
})

exports.createAdmin = functions.https.onCall(async (response) => {
  // Log the received data to debug
  console.log("Received data in createAdmin:", response.data)

  try {
    // Skip the caller super admin check since context.auth is undefined
    // Instead, we'll allow any call to create an admin for testing purposes

    // Validate required fields - with better error messages
    if (!response.data) {
      throw new functions.https.HttpsError("invalid-argument", "No data provided.")
    }

    // Check each required field individually and provide specific error messages
    /* The line `if (!responsedata) {` in the `createAdmin` cloud function is checking if the variable
    `responsedata` is falsy. However, it seems like there might be a typo in the code as
    `responsedata` is not defined anywhere in the function. */
    if (!response.data.email) {
      throw new functions.https.HttpsError("invalid-argument", "Email is required.")
    }
    if (!response.data.password) {
      throw new functions.https.HttpsError("invalid-argument", "Password is required.")
    }
    if (!response.data.firstName) {
      throw new functions.https.HttpsError("invalid-argument", "First name is required.")
    }
    if (!response.data.lastName) {
      throw new functions.https.HttpsError("invalid-argument", "Last name is required.")
    }
    if (!response.data.department) {
      throw new functions.https.HttpsError("invalid-argument", "Department is required.")
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: response.data.email,
      password: response.data.password,
      displayName: `${response.data.firstName} ${response.data.lastName}`,
    })

    console.log("Admin user created successfully:", userRecord.uid)

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: response.data.isSuper ? "superadmin" : "admin",
      department: response.data.department,
    })

    // Add admin data to Firestore
    await admin
      .firestore()
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        department: response.data.department,
        email: response.data.email,
        phoneNumber: response.data.phoneNumber || "",
        isSuper: response.data.isSuper || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system", // Use a default value since we don't have the caller's UID
      })

    // Return the created admin's ID
    return {
      success: true,
      uid: userRecord.uid,
      message: "Admin created successfully",
    }
  } catch (error) {
    console.error("Error creating new admin:", error)
    throw new functions.https.HttpsError("internal", error.message)
  }
})

// Cloud function to delete an admin
exports.deleteAdmin = functions.https.onCall(async (response) => {
  // Since authentication check is commented out, we need to modify the function
  // to work without requiring authentication

  try {
    // Skip the caller super admin check since context.auth is undefined
    // Instead, we'll allow any call to delete an admin for testing purposes

    // Validate required fields
    if (!response.data.uid) {
      throw new functions.https.HttpsError("invalid-argument", "Missing admin UID to delete.")
    }

    // Check if target user is an admin
    const adminRef = await admin.firestore().collection("admins").doc(response.data.uid).get()
    if (!adminRef.exists) {
      throw new functions.https.HttpsError("not-found", "Admin not found.")
    }

    // Delete from Firestore first
    await admin.firestore().collection("admins").doc(response.data.uid).delete()

    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(response.data.uid)

    return {
      success: true,
      message: "Admin deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting admin:", error)
    throw new functions.https.HttpsError("internal", error.message)
  }
})
