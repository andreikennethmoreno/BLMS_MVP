import React, { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Contract {
  id: string;
  templateId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  templateName: string;
  terms: string;
  commissionPercentage: number;
  fields?: any[]; // optional now for safety
  status: string;
  sentAt: string;
  reviewedAt?: string;
  agreedAt?: string;
  disagreedAt?: string;
  disagreementReason?: string;
}

const ContractReviewSystem: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useLocalStorage<Contract[]>(
    "contracts",
    []
  );
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [disagreementReason, setDisagreementReason] = useState("");
  const [showDisagreementForm, setShowDisagreementForm] = useState(false);

  // Normalize contracts so `fields` is always an array and commission is fixed at 15%
  const normalizedContracts = useMemo(
    () =>
      (contracts ?? []).map((c) => ({
        ...c,
        commissionPercentage: 15,
        fields: Array.isArray(c.fields) ? c.fields : [],
      })),
    [contracts]
  );

  // Helper: get initial rate from fields
  const getInitialRate = (fields: any[]) => {
    const rateField = fields.find(
      (f) =>
        f.label?.toLowerCase() === "rate" ||
        f.label?.toLowerCase() === "initial rate"
    );
    return parseFloat(rateField?.value || 0);
  };

  // Helper: calculate final rate with 15% added
  const getFinalRate = (fields: any[]) => {
    const initial = getInitialRate(fields);
    return (initial * 1.15).toFixed(2);
  };

  // Get contracts for current user
  const userContracts = normalizedContracts.filter(
    (c) => c.ownerId === user?.id
  );
  const pendingContracts = userContracts.filter((c) => c.status === "sent");

  const handleAgreeToContract = (contractId: string) => {
    const updatedContracts = normalizedContracts.map((c) =>
      c.id === contractId
        ? {
            ...c,
            status: "agreed",
            agreedAt: new Date().toISOString(),
            reviewedAt: new Date().toISOString(),
          }
        : c
    );
    setContracts(updatedContracts);
    setSelectedContract(null);
  };

  const handleDisagreeToContract = (contractId: string) => {
    if (!disagreementReason.trim()) {
      alert("Please provide a reason for disagreement");
      return;
    }

    const updatedContracts = normalizedContracts.map((c) =>
      c.id === contractId
        ? {
            ...c,
            status: "disagreed",
            disagreedAt: new Date().toISOString(),
            reviewedAt: new Date().toISOString(),
            disagreementReason: disagreementReason.trim(),
          }
        : c
    );
    setContracts(updatedContracts);
    setSelectedContract(null);
    setShowDisagreementForm(false);
    setDisagreementReason("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-orange-600 bg-orange-100";
      case "agreed":
        return "text-green-600 bg-green-100";
      case "disagreed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="w-5 h-5" />;
      case "agreed":
        return <CheckCircle className="w-5 h-5" />;
      case "disagreed":
        return <XCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Contracts Alert */}
      {pendingContracts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-900">
              You have {pendingContracts.length} contract
              {pendingContracts.length > 1 ? "s" : ""} awaiting your review
            </span>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            My Contracts ({userContracts.length})
          </h2>
        </div>

        <div className="p-6">
          {userContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contracts received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.templateName}
                      </h3>
                      <p className="text-gray-600 mb-2">{contract.terms}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Commission: {contract.commissionPercentage}%
                        </span>
                        <span>
                          Final Rate: ${getFinalRate(contract.fields ?? [])}
                        </span>
                        <span>
                          Sent: {new Date(contract.sentAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      <span className="capitalize">{contract.status}</span>
                    </span>
                  </div>

                  {contract.status === "sent" && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Review Contract
                      </button>
                    </div>
                  )}

                  {contract.status === "disagreed" &&
                    contract.disagreementReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Disagreement Reason:</strong>{" "}
                          {contract.disagreementReason}
                        </p>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contract Review Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Contract Review
                </h3>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Contract Template
                  </h4>
                  <p className="text-gray-700">
                    {selectedContract.templateName}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Terms & Conditions
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedContract.terms}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Commission Structure
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800">
                      <strong>
                        Platform Commission:{" "}
                        {selectedContract.commissionPercentage}%
                      </strong>
                    </p>
                    <p className="text-blue-800 mt-1">
                      Final Rate: ${getFinalRate(selectedContract.fields ?? [])}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      This percentage will be added to your proposed rate to
                      determine the final booking price.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Contract Fields
                  </h4>
                  <div className="space-y-3">
                    {(selectedContract.fields ?? []).map(
                      (field: any, index: number) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded p-3"
                        >
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {field.type}
                          </p>
                          {field.value && (
                            <p className="text-sm text-gray-700 mt-1">
                              Value: {field.value}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {!showDisagreementForm ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowDisagreementForm(true)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Disagree
                    </button>
                    <button
                      onClick={() => handleAgreeToContract(selectedContract.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Agree to Contract
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Disagreement
                      </label>
                      <textarea
                        value={disagreementReason}
                        onChange={(e) => setDisagreementReason(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="Please explain why you disagree with this contract..."
                        required
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowDisagreementForm(false);
                          setDisagreementReason("");
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          handleDisagreeToContract(selectedContract.id)
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Submit Disagreement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractReviewSystem;
