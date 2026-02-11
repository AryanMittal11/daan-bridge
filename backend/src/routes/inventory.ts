import express, { Response } from "express";
import prisma from "../prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { requireRole, requireVerified } from "../middleware/rbac";

const router = express.Router();

router.get("/all", authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const items = await prisma.bloodBank.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (error) {
    console.error("Error fetching :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/donors", authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const items = await prisma.bloodDonation.findMany({
      include: {
        donor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.json({ items });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/req/add", authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const { bloodType, units, hospitalName, patientName, contactNo } = req.body;

    // organization ID from logged-in user
    const organizationId = req.user?.sub;

    if (!organizationId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const item = await prisma.bloodRequest.create({
      data: {
        organizationId,
        bloodType,
        units: Number(units),
        hospitalName,
        patientName,
        contactNo,
      },
    });

    res.json({ item });
  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/req/my",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;

      const items = await prisma.bloodRequest.findMany({
        where: {
          organizationId: userId,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ items });
    } catch (error) {
      console.error("Error fetching my requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.get("/req/broadcast", authenticateJWT, async (req: AuthRequest, res) => {
  const userId = req.user?.id;

  const requests = await prisma.bloodRequest.findMany({
    where: {
      organizationId: {
        not: userId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      organization: true,
    },
  });

  const pledges = await prisma.bloodDonation.findMany({
    where: { donorId: userId },
    select: { organizationId: true, bloodType: true },
  });

  const items = requests.map((req) => {
    const hasPledged = pledges.some(
      (p) =>
        p.organizationId === req.organizationId &&
        p.bloodType === req.bloodType,
    );

    return {
      ...req,
      hasPledged,
    };
  });

  res.json({ items });
});

router.post(
  "/req/fulfill/:id",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const requestId = req.params.id;

      // 1. Get the blood request
      const request = await prisma.bloodRequest.findUnique({
        where: { id: requestId as string },
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // 2. Check inventory for the blood type
      const inventory = await prisma.bloodBank.findFirst({
        where: { bloodType: request.bloodType },
      });

      if (!inventory) {
        return res.status(400).json({
          message: "No inventory available for this blood type",
        });
      }

      if (inventory.units < request.units) {
        return res.status(400).json({
          message: "Not enough blood units in inventory",
        });
      }

      // 3. Transaction: deduct units + update request
      await prisma.$transaction([
        prisma.bloodBank.update({
          where: { id: inventory.id },
          data: {
            units: inventory.units - request.units,
          },
        }),

        prisma.bloodRequest.update({
          where: { id: requestId as string },
          data: {
            status: "FULFILLED",
          },
        }),
      ]);

      return res.json({
        message: "Blood request fulfilled successfully",
      });
    } catch (error) {
      console.error("Error fulfilling request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.post(
  "/req/pledge/:id",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const requestId = req.params.id;
      const userId = req.user?.sub;
      const role = req.user?.role;

      if (role !== "INDIVIDUAL") {
        return res
          .status(403)
          .json({ message: "Only individuals can pledge to donate" });
      }

      const request = await prisma.bloodRequest.findUnique({
        where: { id: requestId as string },
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status === "FULFILLED") {
        return res.status(400).json({ message: "Request already fulfilled" });
      }

      const existing = await prisma.bloodDonation.findFirst({
        where: {
          donorId: userId,
          organizationId: request.organizationId,
          bloodType: request.bloodType,
        },
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "You already pledged for this request" });
      }

      await prisma.bloodDonation.create({
        data: {
          donorId: userId,
          organizationId: request.organizationId,
          bloodType: request.bloodType,
          units: request.units,
        },
      });

      return res.json({
        message: "Pledge recorded successfully",
      });
    } catch (error) {
      console.error("Error pledging donation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
