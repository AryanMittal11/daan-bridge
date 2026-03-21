import express, { Response } from "express";
import prisma from "../prisma/client";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { requireRole, requireVerified } from "../middleware/rbac";

const router = express.Router();

router.get("/all", authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.sub;
    const items = await prisma.bloodBank.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (error) {
    console.error("Error fetching :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/inventory/donators", authenticateJWT, async (req: AuthRequest, res: any) => {
  try {
    const orgId = req.user?.sub;

    // Find pledges for requests made by this organization
    const items = await prisma.pledge.findMany({
      where: {
        request: {
          organizationId: orgId
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        request: {
          select: {
            bloodType: true,
            hospitalName: true
          }
        }
      }
    });

    res.json({ items });
  } catch (error) {
    console.error("Error fetching donators:", error);
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

/* 
* GET BROADCAST REQUESTS
* - Returns all requests from other organizations
* - Checks if the current user has pledged
*/
router.get("/req/broadcast", authenticateJWT, async (req: AuthRequest, res) => {
  const userId = req.user?.sub;

  try {
    const requests = await prisma.bloodRequest.findMany({
      where: {
        organizationId: {
          not: userId, // Don't show own requests
        },
        status: {
          not: "FULFILLED",  // Optionally hide fulfilled ones, or show them with status
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        },
        pledges: {
          where: { donorId: userId },
        }
      },
    });

    const items = requests.map((req) => {
      const hasPledged = req.pledges.length > 0;
      return {
        ...req,
        hasPledged,
        pledges: undefined, // Hide raw pledges array
      };
    });

    res.json({ items });
  } catch (error) {
    console.error("Error fetching broadcast requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


/* 
* FULFILL REQUEST (For Organizations)
* - Updates the request status
* - Deducts from inventory
* - Records fulfilling entity
*/
router.post(
  "/req/fulfill/:id",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const requestId = req.params.id as string;
      const orgId = req.user?.sub;
      const { quantity, address } = req.body; // New inputs from form

      if (req.user?.role !== "ORGANIZATION") {
        return res.status(403).json({ message: "Only organizations can fulfill requests" });
      }

      // 1. Get the blood request
      const request = await prisma.bloodRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status === "FULFILLED") {
        return res.status(400).json({ message: "Request already fulfilled" });
      }

      const inventory = await prisma.bloodBank.findFirst({
        where: {
          userId: orgId,
          bloodType: request.bloodType
        },
      });

      if (!inventory) {
        return res.status(400).json({
          message: "No inventory available for this blood type",
        });
      }

      // Calculate remaining needed
      const currentFulfilled = request.fulfilledUnits || 0;
      const remaining = request.units - currentFulfilled;

      // If quantity is provided, use it. Otherwise use remaining needed.
      const fulfillQty = Number(quantity) || remaining;

      if (fulfillQty <= 0) {
        return res.status(400).json({ message: "Invalid fulfillment quantity" });
      }

      if (inventory.units < fulfillQty) {
        return res.status(400).json({
          message: `Not enough blood units in inventory. Available: ${inventory.units}`,
        });
      }

      // Calculate new fulfilled amount
      const newFulfilledTotal = currentFulfilled + fulfillQty;
      const isTotallyFulfilled = newFulfilledTotal >= request.units;

      // 3. Transaction: deduct inventory + update request progress + log
      await prisma.$transaction([
        prisma.bloodBank.update({
          where: { id: inventory.id },
          data: {
            units: inventory.units - fulfillQty,
          },
        }),

        prisma.bloodRequest.update({
          where: { id: requestId as string },
          data: {
            status: isTotallyFulfilled ? "FULFILLED" : "PENDING",
            fulfilledUnits: newFulfilledTotal,
            fulfilledBy: isTotallyFulfilled ? orgId : undefined,
            fulfilledDate: isTotallyFulfilled ? new Date() : undefined,
          },
        }),

        prisma.inventoryLog.create({
          data: {
            organizationId: orgId,
            action: "FULFILL",
            bloodType: request.bloodType,
            units: fulfillQty,
            description: `Fulfilled request for ${request.patientName} (${fulfillQty} units)`,
          }
        }),

        prisma.inventoryItem.upsert({
          where: {
            organizationId_category_name: {
              organizationId: orgId as string,
              category: "BLOOD",
              name: `Blood ${request.bloodType}`
            }
          },
          update: { quantity: { decrement: fulfillQty } },
          create: {
            organizationId: orgId as string,
            category: "BLOOD",
            name: `Blood ${request.bloodType}`,
            quantity: inventory.units - fulfillQty,
            unit: "Units"
          }
        })
      ]);

      return res.json({
        message: isTotallyFulfilled
          ? "Blood request fully fulfilled"
          : `Blood request partially fulfilled. ${newFulfilledTotal}/${request.units} units provided.`,
      });
    } catch (error) {
      console.error("Error fulfilling request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/*
* ADD INVENTORY (For Organizations)
*/
router.post("/add", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { bloodType, units } = req.body;
    const orgId = req.user?.sub;
    const role = req.user?.role;

    if (role !== "ORGANIZATION") {
      return res.status(403).json({ message: "Only organizations can add inventory" });
    }

    const unitsToAdd = Number(units);
    if (isNaN(unitsToAdd) || unitsToAdd <= 0) {
      return res.status(400).json({ message: "Invalid units" });
    }

    // Upsert: Create if not exists, update (increment) if exists
    // We need to find by unique compound key or handle it manually if not set as unique in schema (which it is: @@unique([userId, bloodType]))

    // Check if exists first to know previous value for log? Not strictly needed for ADD action.

    await prisma.$transaction(async (tx) => {
      const existing = await tx.bloodBank.findFirst({
        where: { userId: orgId, bloodType }
      });

      if (existing) {
        await tx.bloodBank.update({
          where: { id: existing.id },
          data: { units: { increment: unitsToAdd } }
        });
      } else {
        await tx.bloodBank.create({
          data: {
            userId: orgId,
            bloodType,
            units: unitsToAdd
          }
        });
      }

      await tx.inventoryLog.create({
        data: {
          organizationId: orgId,
          action: "ADD",
          bloodType,
          units: unitsToAdd,
          description: `Added ${unitsToAdd} units`
        }
      });

      await tx.inventoryItem.upsert({
        where: {
          organizationId_category_name: {
            organizationId: orgId as string,
            category: "BLOOD",
            name: `Blood ${bloodType}`,
          }
        },
        update: { quantity: { increment: unitsToAdd } },
        create: {
          organizationId: orgId as string,
          category: "BLOOD",
          name: `Blood ${bloodType}`,
          quantity: unitsToAdd,
          unit: "Units"
        }
      });
    });

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error adding inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* EDIT INVENTORY (For Organizations)
* Sets the absolute value of units
*/
router.put("/edit/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { units } = req.body;
    const inventoryId = req.params.id as string;
    const orgId = req.user?.sub;

    const newUnits = Number(units);
    if (isNaN(newUnits) || newUnits < 0) {
      return res.status(400).json({ message: "Invalid units" });
    }

    const inventory = await prisma.bloodBank.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory || inventory.userId !== orgId) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const diff = newUnits - inventory.units;
    if (diff === 0) {
      return res.json({ message: "No changes made" });
    }

    await prisma.$transaction([
      prisma.bloodBank.update({
        where: { id: inventoryId },
        data: { units: newUnits }
      }),
      prisma.inventoryLog.create({
        data: {
          organizationId: orgId,
          action: "EDIT",
          bloodType: inventory.bloodType,
          units: Math.abs(diff),
          description: `Updated units from ${inventory.units} to ${newUnits}`
        }
      }),
      prisma.inventoryItem.upsert({
        where: {
          organizationId_category_name: {
            organizationId: orgId as string,
            category: "BLOOD",
            name: `Blood ${inventory.bloodType}`
          }
        },
        update: { quantity: newUnits },
        create: {
          organizationId: orgId as string,
          category: "BLOOD",
          name: `Blood ${inventory.bloodType}`,
          quantity: newUnits,
          unit: "Units"
        }
      })
    ]);

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error editing inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* GET INVENTORY LOGS
*/
router.get("/logs", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.sub;

    const logs = await prisma.inventoryLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* 
* PLEDGE TO DONATE (For Individuals)
* - Creates a Pledge record
*/
router.post(
  "/req/pledge/:id",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const requestId = req.params.id as string;
      const userId = req.user?.sub;
      const role = req.user?.role;
      const { name, address, contact, units } = req.body;

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

      const existing = await prisma.pledge.findFirst({
        where: {
          donorId: userId,
          requestId: requestId
        },
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "You already pledged for this request" });
      }

      const pledgeUnits = Number(units) || request.units;

      if (pledgeUnits > request.units) {
        return res.status(400).json({ message: `Cannot pledge more than requested units (${request.units})` });
      }

      // Check if adding this pledge exceeds requirement
      // Note: We allow over-pledging slightly? Or block?
      // Strict: if (request.fulfilledUnits + pledgeUnits > request.units) error.
      // Loose: Just clamp or allow. Let's allow but cap status. 
      // User asked for progress bar, so let's just update progress.

      const newFulfilled = (request.fulfilledUnits || 0) + pledgeUnits;
      const isFulfilled = newFulfilled >= request.units;

      await prisma.$transaction([
        prisma.pledge.create({
          data: {
            donorId: userId as string,
            requestId: requestId,
            name: name || "Anonymous",
            address: address || "",
            contact: contact || "",
            units: pledgeUnits,
            status: "PENDING"
          },
        }),
        prisma.bloodRequest.update({
          where: { id: requestId },
          data: {
            fulfilledUnits: newFulfilled,
            status: isFulfilled ? "FULFILLED" : "PENDING"
          }
        })
      ]);

      return res.json({
        message: "Pledge recorded successfully",
      });
    } catch (error) {
      console.error("Error pledging donation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// GET pledges for a request (For My Requests view)
router.get("/req/:id/pledges", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id as string;

    const pledges = await prisma.pledge.findMany({
      where: { requestId },
      include: {
        donor: {
          select: { name: true, avatar: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pledges });
  } catch (error) {
    console.error("Error fetching pledges:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* GET GENERAL INVENTORY
*/
router.get("/general", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.sub;
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      orderBy: { lastUpdated: 'desc' }
    });
    res.json({ items });
  } catch (error) {
    console.error("Error fetching general inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* ADD/INCREMENT GENERAL INVENTORY
*/
router.post("/general/add", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.sub;
    const role = req.user?.role;
    const { category, name, quantity, unit, details } = req.body;

    if (role !== "ORGANIZATION") {
      return res.status(403).json({ message: "Only organizations can manage inventory" });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    await prisma.inventoryItem.upsert({
      where: {
        organizationId_category_name: {
          organizationId: orgId as string,
          category,
          name,
        }
      },
      update: {
        quantity: { increment: qty },
        unit: unit || "Units",
        ...(details !== undefined && { details })
      },
      create: {
        organizationId: orgId as string,
        category,
        name,
        quantity: qty,
        unit: unit || "Units",
        ...(details !== undefined && { details })
      }
    });

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error adding to general inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* UPDATE GENERAL INVENTORY
*/
router.put("/general/edit/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.sub;
    const { quantity } = req.body;
    const inventoryId = req.params.id as string;

    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory || inventory.organizationId !== orgId) {
      return res.status(404).json({ message: "Item not found" });
    }

    await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: { quantity: newQty }
    });

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error updating general inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
* DELETE GENERAL INVENTORY
*/
router.delete("/general/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.sub;
    const inventoryId = req.params.id as string;

    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory || inventory.organizationId !== orgId) {
      return res.status(404).json({ message: "Item not found" });
    }

    await prisma.inventoryItem.delete({
      where: { id: inventoryId }
    });

    res.json({ message: "Inventory deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
