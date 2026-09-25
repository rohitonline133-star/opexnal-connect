import React, { useState } from "react";
import { generate2FASecret, verify2FAToken } from "../lib/totp";

export const TwoFactorSetup = ({ userEmail }: { userEmail: string }) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [userToken, setUserToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleEnable2FA = async () => {
    const { secret, qrCodeUrl } = generate2FASecret(userEmail);
    setSecret(secret);
    setQrCode(qrCodeUrl);
  };

  const handleVerify = () => {
    const valid = verify2FAToken(userToken, secret);
    if (valid) {
      setIsVerified(true);
      alert("2FA सफलतापूर्वक चालू हो गया है!");
    } else {
      alert("गलत OTP कोड! दोबारा कोशिश करें।");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-900 text-white my-4">
      <h3 className="text-lg font-bold mb-2">Two-Factor Authentication (2FA)</h3>

      {!qrCode ? (
        <button
          onClick={handleEnable2FA}
          className="bg-blue-600 px-4 py-2 rounded font-semibold text-white"
        >
          2FA चालू करें
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">Authenticator App (Google Authenticator) से QR कोड स्कैन करें:</p>
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 bg-white p-2 rounded" />

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="6-digit OTP"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700"
            />
            <button
              onClick={handleVerify}
              className="bg-green-600 px-4 py-2 rounded font-semibold text-white"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {isVerified && <p className="text-green-400 mt-2">✓ 2FA आपके अकाउंट पर एक्टिव है।</p>}
    </div>
  );
};
