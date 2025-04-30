const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

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
    console.log("Data from createNewEmployee():", response.data);
    //
    // if (!data || !data.email) {
    //     console.error("Invalid data received:", data);
    //     throw new functions.https.HttpsError(
    //         "invalid-argument",
    //         "The function must be called with valid employee data."
    //     );
    // }
    console.log("Email of new user:", response.data.email);
    try {
        const userRecord = await admin.auth().createUser({
            email: response.data.email,
            password: "123123123", // Using your static password
            displayName: `${response.data.firstName} ${response.data.lastName}`
        });

        console.log("User created successfully:", userRecord.uid);

        // Set custom claims for role-based access
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: 'employee',
            department: response.data.department
        });

        // Add user data to Firestore (using the same structure as your current code)
        await admin.firestore().collection('employees').doc(userRecord.uid).set({
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
        });

        // Return the created employee's ID
        return {
            success: true,
            uid: userRecord.uid,
            message: "Employee added successfully"
        };
    }
    catch (error) {
        console.error("Error creating new employee:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});