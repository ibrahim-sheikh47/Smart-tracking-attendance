import { useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckIcon from "@mui/icons-material/Check";
import CustomButton from "../../ui_components/CustomButton";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [systemName, setSystemName] = useState("Tracking System");
  const [adminUsername, setAdminUsername] = useState("admin@admin.com");
  const [adminPassword, setAdminPassword] = useState("admin124@");
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [logoUploaded, setLogoUploaded] = useState(true);

  return (
    <div className="min-h-screen ">
      <div className="mx-auto py-8 px-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium text-gray-800">Settings</h1>
          <button className="bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600">
            Edit
          </button>
        </div>

        {/* Tabs */}
        <div className="rounded-md w-[max-content]  mb-6">
          <div className="flex p-2">
            <button
              className={`px-4 py-2 mr-2 rounded-md cursor-pointer ${
                activeTab === "company"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("company")}
            >
              Company
            </button>
            <button
              className={`px-4 py-2 rounded-md cursor-pointer ${
                activeTab === "profile"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === "company" && (
            <div className="space-y-8">
              {/* System Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Name
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This will be displayed on Top Bar.
                </p>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                />
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company logo
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Update your company logo and then choose where you want it to
                  display.
                </p>
                <div className="flex items-start">
                  <div className="border border-gray-300 rounded-md p-4 mr-4 w-28 h-28 flex items-center justify-center">
                    {logoUploaded ? (
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-md">
                          <span className="text-gray-600">K.M.C</span>
                        </div>
                        <div className="text-sm text-gray-700">Tracking</div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <span>No Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 h-28">
                      <CloudUploadIcon
                        className="text-gray-400 mb-2"
                        style={{ fontSize: 24 }}
                      />
                      <div>
                        <span className="text-emerald-500 cursor-pointer">
                          Click to upload
                        </span>{" "}
                        <span className="text-gray-500">or drag and drop</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        SVG, PNG, JPG or GIF (max. 800×400px)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Admin Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Username
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              {/* <CustomButton
                title={"Change Password"}
                style={"px-10 text-white"}
                onClick={() => navigate("/settings/change-password")}
              /> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
