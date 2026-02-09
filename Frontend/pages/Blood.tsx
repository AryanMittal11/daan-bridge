import React, { useState, useEffect } from "react";
import { useApp } from "../context";
import { Card, Button, Badge, Modal, Input, Select } from "../components/UI";
import { MOCK_BLOOD_STOCK, MOCK_BLOOD_REQUESTS } from "../data";
import {
  Droplet,
  Search,
  Plus,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";
import API from "@/api";

export const Blood = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<
    "inventory" | "requests" | "camps"
  >("requests");
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [bloodDonors, setBloodDonors] = useState<any[]>([]);
  const [bloodReq, setBloodReq] = useState<any[]>([]);
  const [newBloodRequest, setNewBloodRequest] = useState({
    bloodType: "A+",
    units: 1,
    hospitalName: "",
    patientName: "",
    contactNo: "",
  });

  const handleBloodRequestChange = (e: any) => {
    const { name, value } = e.target;
    setNewBloodRequest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchBloodBanks = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/blood/all");
      console.log(data);
      setBloodBanks(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodReqs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/blood/req");
      console.log("blood req*******"+data);
      setBloodReq(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodDonors = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/blood/donors");
      console.log(data);
      setBloodDonors(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBloodRequest = async () => {
    try {
      await API.post("/blood/req/add", newBloodRequest);

      setShowUrgentModal(false);

      // reset form
      setNewBloodRequest({
        bloodType: "",
        units: "",
        hospitalName: "",
        patientName: "",
        contactNo: "",
      });

      // optionally refetch requests
      await fetchBloodReqs();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to create blood request.");
    }
  };

  function timeAgo(date: string | Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (let i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) {
        return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  }

  useEffect(() => {
    fetchBloodBanks();
    fetchBloodDonors();
    fetchBloodReqs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Blood Bank & Donation
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage inventory, find donors, or request blood in emergencies.
          </p>
        </div>
        <Button
          onClick={() => setShowUrgentModal(true)}
          className="bg-red-600 hover:bg-red-700 shadow-red-500/30 flex items-center gap-2"
        >
          <AlertCircle size={18} /> Request Urgent Blood
        </Button>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {["inventory", "requests", "camps"].map((tab) => {
          // Hide inventory for INDIVIDUAL
          if (tab === "inventory" && user?.role === "INDIVIDUAL") return null;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
                activeTab === tab
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === "inventory" && user?.role !== "INDIVIDUAL" && (
        <>
          {bloodBanks && bloodBanks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {bloodBanks.map((stock) => (
                <Card
                  key={stock.id}
                  className="p-4 text-center border-t-4 border-red-500 relative group cursor-pointer"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {stock.bloodType}
                  </h3>

                  <div className="my-2">
                    <Droplet
                      className={`w-8 h-8 mx-auto ${
                        stock.units < 10
                          ? "text-red-500 animate-pulse"
                          : "text-red-400"
                      }`}
                      fill="currentColor"
                    />
                  </div>

                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    {stock.units} Units
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Updated {timeAgo(stock.updatedAt)}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="w-full text-center py-10">
              <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                No blood available
              </p>
            </div>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Recent Donors</h3>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search donor..."
                    className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Blood Type</th>
                  <th className="pb-3">Last Donation</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Contact</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bloodDonors.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 pl-2 font-medium text-slate-700 dark:text-slate-300">
                      {d.donor.name}
                    </td>
                    <td className="py-3">
                      <Badge variant="danger">{d.bloodType}</Badge>
                    </td>
                    <td className="py-3 text-slate-500">
                      Updated {timeAgo(d.updatedAt)}
                    </td>
                    <td className="py-3">
                      <Badge variant="success">Eligible</Badge>
                    </td>
                    <td className="py-3">
                      <button className="text-primary-600 hover:underline">
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {activeTab === "requests" && (
        <div className="space-y-4">
          {bloodReq.map((req) => (
            <Card key={req.id} className="p-6 border-l-4 border-red-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={req.status === "URGENT" ? "danger" : "warning"}
                    >
                      {req.status}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      Requested by {req.patientName}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    <span className="text-red-600">{req.units} Units</span> of{" "}
                    {req.bloodType} Blood
                  </h3>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 mt-2">
                    <MapPin size={16} className="mr-1" /> {req.hospitalName}
                  </div>
                </div>
                {user?.role === "INDIVIDUAL" && (
                  <Button
                    onClick={() =>
                      alert(
                        "Thank you! The hospital has been notified of your pledge.",
                      )
                    }
                  >
                    Pledge to Donate
                  </Button>
                )}
                {user?.role === "ORGANIZATION" && (
                  <Button variant="outline">Fulfill from Inventory</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "camps" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Upcoming Donation Camps</h3>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="bg-red-100 text-red-600 w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold uppercase">Jun</span>
                    <span className="text-xl font-bold">1{i}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      City Center Donation Drive
                    </h4>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <MapPin size={14} className="mr-1" />
                      <span>Central Park, NY</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <Calendar size={14} className="mr-1" />
                      <span>09:00 AM - 05:00 PM</span>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 text-xs py-1.5 h-auto"
                    >
                      Register Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {/* Mock Map Placeholder */}
          <Card className="min-h-[300px] bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
            <div className="text-slate-400 text-center">
              <MapPin size={48} className="mx-auto mb-2 text-slate-300" />
              <p>Map View Loading...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Urgent Blood Request Modal */}
      <Modal
        isOpen={showUrgentModal}
        onClose={() => setShowUrgentModal(false)}
        title="Request Urgent Blood"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm mb-2">
            This will send an immediate alert to all nearby donors and blood
            banks. Only use in emergencies.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Blood Type"
              value={newBloodRequest.bloodType}
              onChange={(e) =>
                setNewBloodRequest({ ...newBloodRequest, bloodType: e.target.value })
              }
            >
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>O+</option>
              <option>O-</option>
              <option>AB+</option>
              <option>AB-</option>
            </Select>
            <Input
              label="Units Needed"
              type="number"
              value={newBloodRequest.units}
              onChange={(e) =>
                setNewBloodRequest({
                  ...newBloodRequest,
                  units: parseInt(e.target.value),
                })
              }
            />
          </div>
          <Input
            label="Hospital Name & Location"
            placeholder="e.g. City General, Ward 4"
            value={newBloodRequest.hospitalName}
            onChange={(e) =>
              setNewBloodRequest({ ...newBloodRequest, hospitalName: e.target.value })
            }
          />
          <Input
            label="Patient Name"
            placeholder="Patient Name"
            value={newBloodRequest.patientName}
            onChange={(e) =>
              setNewBloodRequest({ ...newBloodRequest, patientName: e.target.value })
            }
          />
          <Input
            label="Contact Number"
            placeholder="Emergency Contact"
            value={newBloodRequest.contactNo}
            onChange={(e) =>
              setNewBloodRequest({ ...newBloodRequest, contactNo: e.target.value })
            }
          />
          <Button
            onClick={handleCreateBloodRequest}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Broadcast Alert
          </Button>
        </div>
      </Modal>
    </div>
  );
};
