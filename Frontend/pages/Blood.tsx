import React, { useState, useEffect } from "react";
import { useApp } from "../context";
import { Card, Button, Badge, Modal, Input, Select } from "../components/UI";
import { Droplet, Search, Calendar, MapPin, AlertCircle } from "lucide-react";
import API from "@/api";

export const Blood = () => {
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<
    "inventory" | "my-requests" | "broadcasts" | "camps"
  >("broadcasts");

  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [bloodDonors, setBloodDonors] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [broadcastRequests, setBroadcastRequests] = useState<any[]>([]);

  const [newBloodRequest, setNewBloodRequest] = useState({
    bloodType: "A+",
    units: 1,
    hospitalName: "",
    patientName: "",
    contactNo: "",
  });

  // ------------------ FETCH FUNCTIONS ------------------

  const fetchBloodBanks = async () => {
    try {
      const { data } = await API.get("/blood/all");
      setBloodBanks(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBloodDonors = async () => {
    try {
      const { data } = await API.get("/blood/donors");
      setBloodDonors(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const { data } = await API.get("/blood/req/my");
      setMyRequests(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBroadcastRequests = async () => {
    try {
      const { data } = await API.get("/blood/req/broadcast");
      setBroadcastRequests(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
    fetchBloodDonors();
    fetchMyRequests();
    fetchBroadcastRequests();
  }, []);

  // ------------------ CREATE REQUEST ------------------

  const handleCreateBloodRequest = async () => {
    try {
      await API.post("/blood/req/add", newBloodRequest);

      setShowUrgentModal(false);

      setNewBloodRequest({
        bloodType: "A+",
        units: 1,
        hospitalName: "",
        patientName: "",
        contactNo: "",
      });

      fetchMyRequests();
      fetchBroadcastRequests();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to create request.");
    }
  };

  const handleFulfillRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await API.post(`/blood/req/fulfill/${requestId}`);
      fetchBloodBanks();
      fetchBroadcastRequests();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      alert(err?.response?.data?.message || "Failed to fulfill request");
    }
  };

  const handlePledge = async (requestId: string) => {
    try {
      await API.post(`/blood/req/pledge/${requestId}`);
      fetchBroadcastRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to pledge");
    }
  };

  // ------------------ Logics ------------------

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

  // ------------------ RENDER ------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Blood Bank & Donation</h1>
          <p className="text-slate-500">
            Manage inventory, requests & emergency broadcasts
          </p>
        </div>

        <Button
          onClick={() => setShowUrgentModal(true)}
          className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
        >
          <AlertCircle size={18} />
          Request Urgent Blood
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        {["inventory", "my-requests", "broadcasts", "camps"].map((tab) => {
          if (tab === "inventory" && user?.role === "INDIVIDUAL") return null;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`capitalize pb-2 ${
                activeTab === tab
                  ? "border-b-2 border-red-500 text-red-600"
                  : "text-slate-500"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          );
        })}
      </div>

      {/* INVENTORY TAB */}
      {/* INVENTORY TAB */}
      {activeTab === "inventory" && user?.role !== "INDIVIDUAL" && (
        <div className="space-y-8">
          {/* Blood Stock Grid */}
          {bloodBanks && bloodBanks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {bloodBanks.map((stock) => (
                <Card
                  key={stock.id}
                  className="p-4 text-center border-t-4 border-red-500 relative group"
                >
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

                  <p className="text-lg font-bold">{stock.units} Units</p>

                  <p className="text-xs text-slate-400 mt-1">
                    Updated {timeAgo(stock.updatedAt)}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg font-semibold text-slate-500">
                No blood available
              </p>
            </div>
          )}

          {/* Recent Donors Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Recent Donors</h3>

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

            {bloodDonors.length === 0 ? (
              <p className="text-sm text-slate-500">No donors available</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Blood Type</th>
                    <th className="pb-3">Last Updated</th>
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
                        {d.donor?.name}
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
            )}
          </Card>
        </div>
      )}

      {/* CAMPS TAB */}
      {activeTab === "camps" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              id: 1,
              date: "15",
              month: "Feb",
              title: "City Central Blood Drive",
              location: "City Hospital Auditorium",
              time: "09:00 AM - 04:00 PM",
            },
            {
              id: 2,
              date: "22",
              month: "Feb",
              title: "Community Donation Camp",
              location: "Green Park Community Hall",
              time: "10:00 AM - 05:00 PM",
            },
            {
              id: 3,
              date: "05",
              month: "Mar",
              title: "University Blood Donation Camp",
              location: "ABC University Campus",
              time: "08:30 AM - 03:30 PM",
            },
            {
              id: 4,
              date: "18",
              month: "Mar",
              title: "Corporate CSR Blood Drive",
              location: "Tech Park Convention Center",
              time: "09:30 AM - 06:00 PM",
            },
          ].map((camp) => (
            <Card
              key={camp.id}
              className="p-5 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex gap-4">
                {/* Date Box */}
                <div className="bg-red-100 text-red-600 w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold uppercase">
                    {camp.month}
                  </span>
                  <span className="text-xl font-bold">{camp.date}</span>
                </div>

                {/* Camp Details */}
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white">
                    {camp.title}
                  </h4>

                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <MapPin size={14} className="mr-1" />
                    {camp.location}
                  </div>

                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <Calendar size={14} className="mr-1" />
                    {camp.time}
                  </div>

                  {user?.role === "INDIVIDUAL" && (
                    <Button
                      variant="outline"
                      className="mt-3 text-sm"
                      onClick={() =>
                        alert("You have successfully registered for this camp!")
                      }
                    >
                      Register Now
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MY REQUESTS TAB */}
      {activeTab === "my-requests" && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-slate-500">
                No requests created
              </p>
            </div>
          ) : (
            myRequests.map((req) => (
              <Card
                key={req.id}
                className="p-5 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="danger">{req.bloodType}</Badge>
                    <span className="font-semibold">{req.units} Units</span>
                  </div>

                  <p className="text-sm text-slate-600">
                    Patient: {req.patientName}
                  </p>
                  <p className="text-sm text-slate-600">
                    Hospital: {req.hospitalName}
                  </p>
                  <p className="text-sm text-slate-500">
                    Contact: {req.contactNo}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Requested {timeAgo(req.createdAt)}
                  </p>
                </div>

                {/* STATUS DISPLAY */}
                {req.status === "FULFILLED" ? (
                  <Badge variant="success">Fulfilled</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* BROADCASTS TAB */}
      {activeTab === "broadcasts" && (
        <div className="space-y-4">
          {broadcastRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-slate-500">
                No active broadcasts
              </p>
            </div>
          ) : (
            broadcastRequests.map((req) => (
              <Card
                key={req.id}
                className="p-5 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="danger">{req.bloodType}</Badge>
                    <span className="font-semibold">{req.units} Units</span>
                  </div>

                  <p className="text-sm text-slate-600">
                    Patient: {req.patientName}
                  </p>
                  <p className="text-sm text-slate-600">
                    Hospital: {req.hospitalName}
                  </p>
                  <p className="text-sm text-slate-500">
                    Contact: {req.contactNo}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Requested {timeAgo(req.createdAt)}
                  </p>
                </div>

                {/* STATUS OR FULFILL BUTTON */}
                {/* STATUS OR ACTION */}
                {req.status === "FULFILLED" ? (
                  <Badge variant="success">Fulfilled</Badge>
                ) : user?.role === "INDIVIDUAL" ? (
                  req.hasPledged ? (
                    <Badge variant="success">Pledged</Badge>
                  ) : (
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handlePledge(req.id)}
                    >
                      Pledge to Donate
                    </Button>
                  )
                ) : (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleFulfillRequest(req.id)}
                    disabled={loading}
                  >
                    Fulfill from Inventory
                  </Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* URGENT MODAL */}
      <Modal
        isOpen={showUrgentModal}
        onClose={() => setShowUrgentModal(false)}
        title="Request Urgent Blood"
      >
        <div className="space-y-4">
          <Select
            label="Blood Type"
            value={newBloodRequest.bloodType}
            onChange={(e) =>
              setNewBloodRequest({
                ...newBloodRequest,
                bloodType: e.target.value,
              })
            }
          >
            <option>A+</option>
            <option>B+</option>
            <option>O+</option>
            <option>AB+</option>
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

          <Input
            label="Hospital Name"
            value={newBloodRequest.hospitalName}
            onChange={(e) =>
              setNewBloodRequest({
                ...newBloodRequest,
                hospitalName: e.target.value,
              })
            }
          />

          <Input
            label="Patient Name"
            value={newBloodRequest.patientName}
            onChange={(e) =>
              setNewBloodRequest({
                ...newBloodRequest,
                patientName: e.target.value,
              })
            }
          />

          <Input
            label="Contact Number"
            value={newBloodRequest.contactNo}
            onChange={(e) =>
              setNewBloodRequest({
                ...newBloodRequest,
                contactNo: e.target.value,
              })
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
