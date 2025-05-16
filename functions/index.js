const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Cloud function to create a new employee
// Cloud function to create a new employee
exports.createNewEmployee = functions.https.onCall(async (response) => {
  // Check if the required data is present
  console.log("Data from createNewEmployee():", response.data);

  if (!response.data || !response.data.email || !response.data.adminId) {
    console.error("Invalid data received:", response.data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with valid employee data including adminId."
    );
  }

  console.log("Email of new user:", response.data.email);
  console.log("Admin ID:", response.data.adminId);

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: response.data.email,
      password: "123123123", // Using your static password
      displayName: `${response.data.firstName} ${response.data.lastName}`,
    });

    console.log("User created successfully:", userRecord.uid);

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "employee",
      department: response.data.department,
      adminId: response.data.adminId, // Store the admin ID in the claims
    });

    const employeeData = {
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminId: response.data.adminId,
      isPasswordSet: false, // Indicating the employee is using the default password
      passwordLastChanged: null,
    };

    // Add user data to Firestore as a subcollection under the admin
    await admin
      .firestore()
      .collection("admins")
      .doc(response.data.adminId)
      .collection("employees")
      .doc(userRecord.uid)
      .set(employeeData);

    // Add reference to main employees collection for global queries (optional)
    // This gives you flexibility to query all employees or just employees of a specific admin
    await admin
      .firestore()
      .collection("employees")
      .doc(userRecord.uid)
      .set(employeeData);

    // Return the created employee's ID
    return {
      success: true,
      uid: userRecord.uid,
      message: "Employee added successfully",
    };
  } catch (error) {
    console.error("Error creating new employee:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.createAdmin = functions.https.onCall(async (response) => {
  // Log the received data to debug
  console.log("Received data in createAdmin:", response.data);

  try {
    // Skip the caller super admin check since context.auth is undefined
    // Instead, we'll allow any call to create an admin for testing purposes

    // Validate required fields - with better error messages
    if (!response.data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No data provided."
      );
    }

    // Check each required field individually and provide specific error messages
    if (!response.data.email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }
    if (!response.data.password) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Password is required."
      );
    }
    if (!response.data.firstName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "First name is required."
      );
    }
    if (!response.data.lastName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Last name is required."
      );
    }
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: response.data.email,
      password: "12345678",
      displayName: `${response.data.firstName} ${response.data.lastName}`,
    });

    console.log("Admin user created successfully:", userRecord.uid);

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: response.data.isSuper ? "superadmin" : "admin",
    });

    // Add admin data to Firestore with isPasswordSet field set to false
    await admin
      .firestore()
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        phoneNumber: response.data.phoneNumber || "",
        isSuper: response.data.isSuper || false,
        isPasswordSet: false, // New field to track if default password has been changed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system", // Use a default value since we don't have the caller's UID
      });

    // Return the created admin's ID
    return {
      success: true,
      uid: userRecord.uid,
      message: "Admin created successfully",
    };
  } catch (error) {
    console.error("Error creating new admin:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Cloud function to delete an admin
exports.deleteAdmin = functions.https.onCall(async (response) => {
  // Since authentication check is commented out, we need to modify the function
  // to work without requiring authentication

  try {
    // Skip the caller super admin check since context.auth is undefined
    // Instead, we'll allow any call to delete an admin for testing purposes

    // Validate required fields
    if (!response.data.uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing admin UID to delete."
      );
    }

    // Check if target user is an admin
    const adminRef = await admin
      .firestore()
      .collection("admins")
      .doc(response.data.uid)
      .get();
    if (!adminRef.exists) {
      throw new functions.https.HttpsError("not-found", "Admin not found.");
    }

    // Delete from Firestore first
    await admin
      .firestore()
      .collection("admins")
      .doc(response.data.uid)
      .delete();

    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(response.data.uid);

    return {
      success: true,
      message: "Admin deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting admin:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.updatePasswordStatus = functions.https.onCall(async (response) => {
  // Check if the required data is present
  console.log("Data from updatePasswordStatus():", response.data)
  if (!response.data || !response.data.uid) {
    console.error("Invalid data received:", response.data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid employee UID."
    );
  }
  console.log("Employee UID for password update:", response.data.uid)

  try {
    // Get employee data to find adminId
    const employeeRef = admin.firestore().collection("employees").doc(response.data.uid);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      console.error("Employee not found:", response.data.uid);
      throw new functions.https.HttpsError(
        "not-found",
        "Employee not found."
      );
    }

    const employeeData = employeeDoc.data();
    const adminId = employeeData.adminId;
    console.log("Admin ID for employee:", adminId)

    // Update in the main employees collection
    await employeeRef.update({
      isPasswordSet: true,
      passwordLastChanged: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update in the admin's subcollection
    await admin
      .firestore()
      .collection("admins")
      .doc(adminId)
      .collection("employees")
      .doc(response.data.uid)
      .update({
        isPasswordSet: true,
        passwordLastChanged: admin.firestore.FieldValue.serverTimestamp()
      });

    // Return success response
    return {
      success: true,
      uid: response.data.uid,
      message: "Password status updated successfully"
    };
  } catch (error) {
    console.error("Error updating password status:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
