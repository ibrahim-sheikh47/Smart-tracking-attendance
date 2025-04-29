const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Cloud function to create a new employee
exports.createNewEmployee = functions.https.onCall(async (data, context) => {
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

    try {
        const userRecord = await admin.auth().createUser({
            email: "helloali@gmail.com",
            password: "123123", // Using your static password
            //displayName: `${data.firstName} ${data.lastName}`,
            // photoURL: data.profileImageUrl || '',
        });


        // Set custom claims for role-based access
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: 'employee',
            department: data.department
        });

        // Add user data to Firestore (using the same structure as your current code)
        await admin.firestore().collection('employees').doc(userRecord.uid).set({
            uid: userRecord.uid,
            firstName: "Ali",
            lastName: "Lal Din",
            department: "Management",
            bio: "Hello I am a well know s beast.",
            email: "helloworld@gmail.com",
            phoneNumber: "03316714994",
            designation: "Bed Master",
            hourlyRate: "6",
            workingHours: "9",
            overtimeRate: "10",
            // profileImageUrl: data.profileImageUrl || "",
            //createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Return the created employee's ID
        return {
            success: true,
            uid: userRecord.uid,
            message: "Employee added successfully"
        };
    } catch (error) {
        console.error("Error creating new employee:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});