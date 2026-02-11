import React, { useState, useEffect } from "react";
import { useApp } from "../context";
import {
  Card,
  Badge,
  Button,
  ProgressBar,
  Modal,
  Input,
  Select,
} from "../components/UI";
import API from "../api";
import { CreditCard, Truck, Download } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Campaigns = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState<any | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<any | null>(
    null,
  );
  const [donationStep, setDonationStep] = useState(1);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Donate form state
  const [donateAmount, setDonateAmount] = useState("");
  const [donateType, setDonateType] = useState<"MONEY" | "MATERIAL" | "BLOOD" | "VOLUNTEER">("");
  const [donateItems, setDonateItems] = useState("");
  const [donateSubmitting, setDonateSubmitting] = useState(false);
  const [donationsList, setDonationsList] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newRequest, setNewRequest] = useState({
    type: "MONETARY",
    title: "",
    target: "",
    description: "",
    unit: "USD",
    category: "",
    image: "",
    location: "",
    deadline: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/campaigns/all");
      console.log(data);
      setCampaigns(data.campaigns || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns
    .filter(
      (c) =>
        activeTab === "All" ||
        c.type === activeTab.toUpperCase() ||
        (c.category && c.category.toLowerCase() === activeTab.toLowerCase()),
    )
    .filter(
      (c) =>
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase()),
    );

  const handleCreate = async () => {
    if (!newRequest.title || !newRequest.target || !newRequest.type) {
      alert("Please fill in all required fields (Title, Target, Type).");
      return;
    }

    try {
      let imageUrl = newRequest.image;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const { data: uploadData } = await API.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrl = uploadData.url;
        } catch (err) {
          console.error("Image upload failed", err);
          alert("Failed to upload image. Campaign will be created without it.");
        }
      }

      await API.post("/campaigns/add", { ...newRequest, image: imageUrl });
      setShowCreateModal(false);
      setNewRequest({
        type: "MONETARY",
        title: "",
        target: "",
        description: "",
        unit: "USD",
        category: "",
        image: "",
        location: "",
        deadline: "",
      });
      setImageFile(null);
      await fetchCampaigns();
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
        "Failed to create campaign. Make sure you are a verified organization or admin.",
      );
    }
  };

  const handleDonateSubmit = async () => {
    if (!showDonateModal) return;

    // For Volunteer, if strictly just signing up, we can treat amount as 1 (person)
    const amount =
      (showDonateModal.type === "MONETARY" || showDonateModal.type === "BLOOD")
        ? Number(donateAmount)
        : (showDonateModal.type === "VOLUNTEER" ? 1 : (donateItems ? 1 : 0));

    if (showDonateModal.type === "MATERIAL" && !donateItems.trim()) {
      alert("Please describe the items you are donating.");
      return;
    }
    if ((showDonateModal.type === "MONETARY" || showDonateModal.type === "BLOOD") && (!amount || amount <= 0)) {
      alert("Please enter a valid amount.");
      return;
    }

    setDonateSubmitting(true);
    try {
      const { data } = await API.post(
        `/campaigns/${showDonateModal.id}/donate`,
        {
          amount,
          type: showDonateModal.type,
          items: showDonateModal.type === "MATERIAL" ? donateItems : undefined,
        },
      );
      setDonationStep(3);
      if (data.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === data.campaign.id ? data.campaign : c)),
        );
      }
    } catch (e: any) {
      alert(e.response?.data?.message || "Donation failed.");
    } finally {
      setDonateSubmitting(false);
    }
  };

  const closeDonateModal = () => {
    setShowDonateModal(null);
    setDonationStep(1);
    setDonateAmount("");
    setDonateItems("");
    setDonateType("MONEY");
  };

  const getAnalyticsData = (campaign: any) => {
    if (!campaign) return { dailyData: [] };
    const dailyData = [
      { name: "Mon", amount: campaign.raised * 0.1 },
      { name: "Tue", amount: campaign.raised * 0.15 },
      { name: "Wed", amount: campaign.raised * 0.12 },
      { name: "Thu", amount: campaign.raised * 0.25 },
      { name: "Fri", amount: campaign.raised * 0.2 },
      { name: "Sat", amount: campaign.raised * 0.18 },
      { name: "Sun", amount: campaign.raised * 0.3 },
    ];
    return { dailyData };
  };

  const fetchCampaignDonations = async (campaignId: string) => {
    try {
      const { data } = await API.get(`/campaigns/${campaignId}/donations`);
      setDonationsList(data.donations || []);
    } catch {
      setDonationsList([]);
    }
  };

  const openAnalytics = (campaign: any) => {
    setShowAnalyticsModal(campaign);
    fetchCampaignDonations(campaign.id);
  };

  const analyticsData = getAnalyticsData(showAnalyticsModal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Campaigns & Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.role === "ORGANIZATION"
              ? "Manage your initiatives and monitor progress."
              : "Support causes that matter or create your own request."}
          </p>
        </div>
        {(user?.role === "ORGANIZATION" || user?.role === "ADMIN") && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            + Create Request
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            "All",
            "Disaster",
            "Education",
            "Health",
            "Welfare",
            "MATERIAL",
            "VOLUNTEER",
            "BLOOD",
            "MONETARY",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12">Loading...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">
            No campaigns found.
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col h-full group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={campaign.image || "https://via.placeholder.com/400x200"}
                  alt={campaign.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {campaign.urgent && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">
                    URGENT
                  </span>
                )}
                <span className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-slate-200">
                  {campaign.type}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-1">
                  {campaign.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  by {campaign.organizer}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 flex-1">
                  {campaign.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>
                      {campaign.raised} {campaign.unit} raised
                    </span>
                    <span>
                      {campaign.target
                        ? Math.round((campaign.raised / campaign.target) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <ProgressBar
                    value={campaign.raised}
                    max={campaign.target || 1}
                  />
                  <p className="text-xs text-slate-400 text-right">
                    Goal: {campaign.target} {campaign.unit}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-xs text-slate-500">
                    {(campaign.location || "").split(",")[0] || "—"}
                  </div>
                  <div className="flex gap-2">
                    {(user?.role === "INDIVIDUAL" ||
                      user?.role === "ORGANIZATION") && (
                        campaign.raised >= campaign.target ? (
                          <Button size="sm" disabled>
                            Completed
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setShowDonateModal(campaign);
                              setDonationStep(1);
                            }}
                          >
                            {campaign.type === "VOLUNTEER" ? "Volunteer" : "Donate"}
                          </Button>
                        )
                      )}
                    {(user?.role === "ORGANIZATION" ||
                      user?.role === "ADMIN") && (
                        <button
                          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Analytics"
                          onClick={() => openAnalytics(campaign)}
                        >
                          📊
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Request"
      >
        <div className="space-y-4">
          <Select
            label="Request Type"
            value={newRequest.type}
            onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
          >
            <option value="MONETARY">Monetary Fundraiser</option>
            <option value="MATERIAL">Material Donation Drive</option>
            <option value="VOLUNTEER">Call for Volunteers</option>
            <option value="BLOOD">Blood Donation Camp</option>
          </Select>
          <Input
            label="Campaign Title"
            value={newRequest.title}
            onChange={(e) =>
              setNewRequest({ ...newRequest, title: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount/Units"
              type="number"
              value={newRequest.target}
              onChange={(e) =>
                setNewRequest({ ...newRequest, target: e.target.value })
              }
            />
            <Select
              label="Unit"
              value={newRequest.unit}
              onChange={(e) =>
                setNewRequest({ ...newRequest, unit: e.target.value })
              }
            >
              <option>USD</option>
              <option>Items</option>
              <option>Volunteers</option>
              <option>Pints</option>
            </Select>
          </div>
          <Input
            label="Category"
            value={newRequest.category}
            onChange={(e) =>
              setNewRequest({ ...newRequest, category: e.target.value })
            }
          />
          <Input
            label="Location"
            value={newRequest.location}
            onChange={(e) =>
              setNewRequest({ ...newRequest, location: e.target.value })
            }
          />
          <Input
            type="file"
            label="Image"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const previewUrl = URL.createObjectURL(file);

              setImageFile(file);
            }}
          />

          <Input
            label="Deadline"
            value={newRequest.deadline}
            onChange={(e) =>
              setNewRequest({ ...newRequest, deadline: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none"
              value={newRequest.description}
              onChange={(e) =>
                setNewRequest({ ...newRequest, description: e.target.value })
              }
            />
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Submit for Review
          </Button>
        </div>
      </Modal>

      {/* Donate Modal */}
      <Modal
        isOpen={!!showDonateModal}
        onClose={closeDonateModal}
        title={
          showDonateModal ? `Donate to ${showDonateModal.title}` : "Donate"
        }
      >
        {showDonateModal && (
          <>
            {donationStep === 1 && (
              <div className="space-y-4">
                <p className="text-slate-500 text-sm">
                  {showDonateModal.description}
                </p>

                {showDonateModal.type === "MONETARY" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {["10", "50", "100", "250", "500", "1000"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setDonateAmount(amt)}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <Input
                      label="Custom Amount ($)"
                      type="number"
                      placeholder="Enter amount"
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                    />
                  </>
                )}
                {showDonateModal.type === "MATERIAL" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description of items
                    </label>
                    <textarea
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none"
                      placeholder="e.g. 2 boxes winter clothes, 5 blankets"
                      value={donateItems}
                      onChange={(e) => setDonateItems(e.target.value)}
                    />
                  </div>
                )}
                {showDonateModal.type === "VOLUNTEER" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Volunteer Details
                    </label>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 mb-4">
                      You are signing up to volunteer for this campaign.
                      <br />Location : {showDonateModal.location}
                      <br />Deadline :{showDonateModal.deadline ? new Date(showDonateModal.deadline).toLocaleDateString() : "—"}
                    </div>
                  </div>
                )}
                {showDonateModal.type === "BLOOD" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {["10", "50", "100", "250", "500", "1000"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setDonateAmount(amt)}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                    <Input
                      label="Custom Units"
                      type="number"
                      placeholder="Enter number of pints"
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                    />
                  </>
                )}
                <Button className="w-full" onClick={() => setDonationStep(2)}>
                  Continue
                </Button>
              </div>
            )}

            {donationStep === 2 && (
              <div className="space-y-6">
                {showDonateModal.type === "MONETARY" && (
                  <>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <CreditCard size={24} />
                      <span>Payment will be processed securely.</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      You are donating <strong>${donateAmount || "0"}</strong>{" "}
                      to {showDonateModal.title}.
                    </p>
                  </>
                )}
                {showDonateModal.type === "MATERIAL" || showDonateModal.type === "BLOOD" && (
                  <>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Truck size={24} />
                      <span>
                        Schedule pickup or drop-off with the organizer.
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      You are pledging: <strong>{donateItems || "—"}</strong>
                    </p>
                  </>
                )}
                {showDonateModal.type === "VOLUNTEER" && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                    Thank you for volunteering! The organizer will contact you with further details.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDonationStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleDonateSubmit}
                    disabled={donateSubmitting}
                  >
                    {donateSubmitting ? "Processing..." : "Confirm Donation"}
                  </Button>
                </div>
              </div>
            )}

            {donationStep === 3 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                  Thank you!
                </h3>
                <p className="text-slate-500 mt-2 mb-6">
                  Your contribution has been recorded.
                </p>
                <Button className="w-full" onClick={closeDonateModal}>
                  Close
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={!!showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(null)}
        title="Campaign Analytics"
      >
        {showAnalyticsModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Donors
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {donationsList.length}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Raised
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {showAnalyticsModal.raised} {showAnalyticsModal.unit}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Goal
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {showAnalyticsModal.target} {showAnalyticsModal.unit}
                </p>
              </div>
            </div>
            <div className="h-48 w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Donation trend (demo)
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyData}>
                  <defs>
                    <linearGradient
                      id="colorAnalytics"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#colorAnalytics)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-800 dark:text-white">
                  Recent activity
                </h4>
                <button
                  type="button"
                  className="text-primary-600 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  <Download size={12} /> Export CSV
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {donationsList.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">
                    No donations yet.
                  </p>
                ) : (
                  donationsList.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {d.donorName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-white">
                          {d.type === "MONETARY"
                            ? `$${d.amount}`
                            : d.items || `${d.amount} item(s)`}
                        </p>
                        <Badge variant="success">Completed</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
