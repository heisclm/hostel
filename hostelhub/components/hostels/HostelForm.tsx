/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bed,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Wifi,
  Droplets,
  Zap,
  Shield,
  Car,
  UtensilsCrossed,
  Wind,
  Tv,
  BookOpen,
  Shirt,
  ImageIcon,
  Hash,
  Building,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Info,
  Edit3,
  RotateCcw,
  Camera,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  useCreateHostel,
  useUpdateHostel,
  useRoomTypes,
  useFacilities,
  useHostelImages,
  usePaymentDetail,
} from "@/hooks/useManagerHostels";
import type {
  CreateHostelPayload,
  UpdateHostelPayload,
  OccupancyType,
  PricingPeriod,
  HostelDetail,
} from "@/services/hostel.service";
import Image from "next/image";

interface RoomData {
  roomNumber: string;
  floor: number;
  notes?: string;
}

interface RoomTypeFormData {
  id?: string;
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  amenities: string[];
  description: string;
  rooms: RoomData[];
  isNew?: boolean;
  isModified?: boolean;
  isExpanded?: boolean;
  showRoomDetails?: boolean;
}

interface ImageFormData {
  id?: string;
  file?: File;
  url?: string;
  preview: string;
  isPrimary: boolean;
  isNew?: boolean;
}

interface HostelFormProps {
  initialData?: HostelDetail;
  isEditing?: boolean;
  hostelId?: string;
}

type FormStep = "basic" | "rooms" | "facilities" | "payment" | "images";

const STEPS: {
  id: FormStep;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "basic",
    label: "Basic Info",
    shortLabel: "Basic",
    description: "Hostel details",
    icon: Building,
  },
  {
    id: "rooms",
    label: "Room Types",
    shortLabel: "Rooms",
    description: "Room configuration",
    icon: Bed,
  },
  {
    id: "facilities",
    label: "Facilities",
    shortLabel: "Facilities",
    description: "Amenities & rules",
    icon: Wifi,
  },
  {
    id: "payment",
    label: "Payment",
    shortLabel: "Payment",
    description: "Payment details",
    icon: CreditCard,
  },
  {
    id: "images",
    label: "Images",
    shortLabel: "Photos",
    description: "Photos & media",
    icon: Camera,
  },
];

const FACILITY_OPTIONS = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "water", label: "Water Supply", icon: Droplets },
  { id: "electricity", label: "Electricity", icon: Zap },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "parking", label: "Parking", icon: Car },
  { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "tv_lounge", label: "TV Lounge", icon: Tv },
  { id: "study_room", label: "Study Room", icon: BookOpen },
  { id: "laundry", label: "Laundry", icon: Shirt },
];

const OCCUPANCY_OPTIONS: {
  type: OccupancyType;
  label: string;
  shortLabel: string;
  persons: number;
  description: string;
}[] = [
  {
    type: "IN_1",
    label: "Single Room",
    shortLabel: "Single",
    persons: 1,
    description: "1 person per room",
  },
  {
    type: "IN_2",
    label: "Double Room",
    shortLabel: "Double",
    persons: 2,
    description: "2 persons per room",
  },
  {
    type: "IN_3",
    label: "Triple Room",
    shortLabel: "Triple",
    persons: 3,
    description: "3 persons per room",
  },
  {
    type: "IN_4",
    label: "Quad Room",
    shortLabel: "Quad",
    persons: 4,
    description: "4 persons per room",
  },
];

const PRICING_PERIOD_LABELS: Record<PricingPeriod, string> = {
  PER_SEMESTER: "per semester",
  PER_YEAR: "per academic year",
};

const PRICING_PERIOD_SHORT_LABELS: Record<PricingPeriod, string> = {
  PER_SEMESTER: "/semester",
  PER_YEAR: "/year",
};

const ROOM_AMENITY_OPTIONS = [
  { name: "Wardrobe", icon: "🗄️" },
  { name: "Study Desk", icon: "📚" },
  { name: "Chair", icon: "🪑" },
  { name: "Ceiling Fan", icon: "🌀" },
  { name: "Attached Bathroom", icon: "🚿" },
  { name: "Shared Bathroom", icon: "🛁" },
  { name: "Balcony", icon: "🌅" },
  { name: "Window", icon: "🪟" },
  { name: "Mosquito Net", icon: "🦟" },
];

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        "fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg sm:max-w-md",
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800",
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

function MobileStepIndicator({
  steps,
  currentStepIndex,
  onStepClick,
}: {
  steps: typeof STEPS;
  currentStepIndex: number;
  onStepClick: (step: FormStep) => void;
}) {
  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div className="sm:hidden mb-6">
      <div className="flex gap-1 mb-4">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index < currentStepIndex
                ? "bg-green-500"
                : index === currentStepIndex
                  ? "bg-primary-500"
                  : "bg-slate-200",
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
            <p className="text-xs text-slate-500">{currentStep.label}</p>
          </div>
        </div>

        <select
          value={currentStep.id}
          onChange={(e) => onStepClick(e.target.value as FormStep)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {steps.map((step, index) => (
            <option key={step.id} value={step.id}>
              {index + 1}. {step.shortLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DesktopStepIndicator({
  steps,
  currentStepIndex,
  onStepClick,
}: {
  steps: typeof STEPS;
  currentStepIndex: number;
  onStepClick: (step: FormStep) => void;
}) {
  return (
    <div className="hidden sm:block mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex items-center flex-1 last:flex-none"
            >
              <button
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex flex-col items-center transition-all group",
                  isCurrent
                    ? "text-primary-600"
                    : isCompleted
                      ? "text-green-600"
                      : "text-slate-400",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-1.5 transition-all",
                    isCurrent
                      ? "bg-primary-100 text-primary-600 ring-2 ring-primary-500 ring-offset-2"
                      : isCompleted
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden md:block">
                  {step.label}
                </span>
                <span className="text-xs font-medium md:hidden">
                  {step.shortLabel}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 md:mx-4">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      index < currentStepIndex
                        ? "bg-green-400"
                        : "bg-slate-200",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HostelForm({
  initialData,
  isEditing = false,
  hostelId,
}: HostelFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [basicInfo, setBasicInfo] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    distanceToCampus: initialData?.distanceToCampus?.toString() || "",
    totalRooms: initialData?.totalRooms?.toString() || "",
    pricingPeriod: (initialData?.pricingPeriod ||
      "PER_SEMESTER") as PricingPeriod,
    allowSemesterPayment: initialData?.allowSemesterPayment ?? true,
  });

  const [roomTypes, setRoomTypes] = useState<RoomTypeFormData[]>(
    initialData?.roomTypes?.map((rt) => ({
      id: rt.id,
      occupancyType: rt.occupancyType,
      pricePerPerson: Number(rt.pricePerPerson),
      totalRooms: rt.rooms?.length || rt.totalRooms || 0,
      amenities: rt.amenities,
      description: rt.description || "",
      rooms:
        rt.rooms?.map((r) => ({
          roomNumber: r.roomNumber,
          floor: r.floor || 1,
          notes: r.notes || "",
        })) || [],
      isNew: false,
      isModified: false,
      isExpanded: true,
      showRoomDetails: false,
    })) || [],
  );

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    initialData?.facilities?.map((f) => f.name.toLowerCase()) || [],
  );

  const [paymentInfo, setPaymentInfo] = useState({
    accountName: initialData?.paymentDetail?.accountName || "",
    momoNumber: initialData?.paymentDetail?.momoNumber || "",
    momoProvider: initialData?.paymentDetail?.momoProvider || "MTN",
    alternatePhone: initialData?.paymentDetail?.alternatePhone || "",
    notes: initialData?.paymentDetail?.notes || "",
  });

  const [images, setImages] = useState<ImageFormData[]>(
    initialData?.images?.map((img) => ({
      id: img.id,
      url: img.url,
      preview: img.url,
      isPrimary: img.isPrimary,
      isNew: false,
    })) || [],
  );

  const getTotalRoomsConfigured = useCallback(() => {
    return roomTypes.reduce((sum, rt) => sum + rt.rooms.length, 0);
  }, [roomTypes]);

  const getRemainingRoomsAllowed = useCallback(() => {
    const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
    const totalConfigured = getTotalRoomsConfigured();
    return Math.max(0, totalAllowed - totalConfigured);
  }, [basicInfo.totalRooms, getTotalRoomsConfigured]);

  const canAddMoreRooms = useCallback(
    (roomTypeIndex?: number) => {
      const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
      const totalConfigured = getTotalRoomsConfigured();

      if (roomTypeIndex !== undefined) {
        const currentRoomTypeRooms =
          roomTypes[roomTypeIndex]?.rooms.length || 0;
        return totalConfigured - currentRoomTypeRooms < totalAllowed;
      }

      return totalConfigured < totalAllowed;
    },
    [basicInfo.totalRooms, getTotalRoomsConfigured, roomTypes],
  );

  const { createHostel, isCreating } = useCreateHostel();
  const { updateHostel, isUpdating } = useUpdateHostel();
  const {
    addRoomType,
    updateRoomType,
    deleteRoomType,
    isLoading: roomTypeLoading,
  } = useRoomTypes();
  const {
    addFacilities,
    removeFacility,
    isLoading: facilitiesLoading,
  } = useFacilities();
  const {
    addImages,
    removeImage,
    setPrimaryImage,
    isLoading: imagesLoading,
  } = useHostelImages();
  const { upsertPaymentDetail, isLoading: paymentLoading } = usePaymentDetail();

  const isSubmitting =
    isCreating ||
    isUpdating ||
    roomTypeLoading ||
    facilitiesLoading ||
    imagesLoading ||
    paymentLoading;

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const goToStep = (step: FormStep) => {
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const getOccupancyNumber = (type: OccupancyType): number => {
    const map: Record<OccupancyType, number> = {
      IN_1: 1,
      IN_2: 2,
      IN_3: 3,
      IN_4: 4,
    };
    return map[type];
  };

  const getOccupancyOption = (type: OccupancyType) => {
    return OCCUPANCY_OPTIONS.find((o) => o.type === type)!;
  };

  const addNewRoomType = () => {
    const usedTypes = roomTypes.map((rt) => rt.occupancyType);
    const availableTypes = OCCUPANCY_OPTIONS.filter(
      (o) => !usedTypes.includes(o.type),
    );

    if (availableTypes.length === 0) {
      showToast("All room types have been added", "error");
      return;
    }

    setRoomTypes([
      ...roomTypes,
      {
        occupancyType: availableTypes[0].type,
        pricePerPerson: 0,
        totalRooms: 0,
        amenities: [],
        description: "",
        rooms: [],
        isNew: true,
        isExpanded: true,
        showRoomDetails: false,
      },
    ]);
  };

  const updateRoomTypeForm = (index: number, field: string, value: unknown) => {
    if (field === "totalRooms") {
      const requestedTotal = value as number;
      const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
      const otherRoomsCount = roomTypes.reduce(
        (sum, rt, idx) => (idx !== index ? sum + rt.rooms.length : sum),
        0,
      );
      const maxAllowedForThisType = totalAllowed - otherRoomsCount;

      if (requestedTotal > maxAllowedForThisType) {
        showToast(
          `Maximum ${maxAllowedForThisType} rooms allowed for this type (${otherRoomsCount} rooms in other types, total limit: ${totalAllowed})`,
          "error",
        );

        value = maxAllowedForThisType;
      }
    }

    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === index ? { ...rt, [field]: value, isModified: !rt.isNew } : rt,
      ),
    );
  };

  const removeRoomTypeForm = (index: number) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRoomTypeExpanded = (index: number) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === index ? { ...rt, isExpanded: !rt.isExpanded } : rt,
      ),
    );
  };

  const toggleShowRoomDetails = (index: number) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === index ? { ...rt, showRoomDetails: !rt.showRoomDetails } : rt,
      ),
    );
  };

  const autoGenerateRooms = (roomTypeIndex: number) => {
    const roomType = roomTypes[roomTypeIndex];
    const requestedCount = roomType.totalRooms;

    if (requestedCount <= 0) {
      showToast("Please enter the number of rooms first", "error");
      return;
    }

    const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
    const otherRoomsCount = roomTypes.reduce(
      (sum, rt, idx) => (idx !== roomTypeIndex ? sum + rt.rooms.length : sum),
      0,
    );
    const maxAllowedForThisType = totalAllowed - otherRoomsCount;

    if (maxAllowedForThisType <= 0) {
      showToast(
        `You've already configured ${otherRoomsCount} rooms. No more rooms can be added (total limit: ${totalAllowed})`,
        "error",
      );
      return;
    }

    const actualCount = Math.min(requestedCount, maxAllowedForThisType);

    if (actualCount < requestedCount) {
      showToast(
        `Only ${actualCount} rooms can be added (${otherRoomsCount} already configured, total limit: ${totalAllowed})`,
        "error",
      );
    }

    const prefix = `${roomType.occupancyType.replace("IN_", "")}`;

    const newRooms: RoomData[] = [];
    for (let i = 1; i <= actualCount; i++) {
      const floor = Math.ceil(i / 10);
      newRooms.push({
        roomNumber: `${prefix}${String(i).padStart(2, "0")}`,
        floor,
        notes: "",
      });
    }

    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === roomTypeIndex
          ? {
              ...rt,
              rooms: newRooms,
              totalRooms: actualCount,
              isModified: !rt.isNew,
            }
          : rt,
      ),
    );

    if (actualCount === requestedCount) {
      showToast(
        `Generated ${actualCount} room numbers successfully!`,
        "success",
      );
    }
  };

  const addRoomToRoomType = (roomTypeIndex: number) => {
    const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
    const totalConfigured = getTotalRoomsConfigured();

    if (totalConfigured >= totalAllowed) {
      showToast(
        `Cannot add more rooms. You've reached the limit of ${totalAllowed} total rooms.`,
        "error",
      );
      return;
    }

    const roomType = roomTypes[roomTypeIndex];
    const prefix = `${roomType.occupancyType.replace("IN_", "")}`;
    const nextNum = roomType.rooms.length + 1;

    const newRoom: RoomData = {
      roomNumber: `${prefix}${String(nextNum).padStart(2, "0")}`,
      floor: Math.ceil(nextNum / 10),
      notes: "",
    };

    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === roomTypeIndex
          ? {
              ...rt,
              rooms: [...rt.rooms, newRoom],
              totalRooms: rt.rooms.length + 1,
              isModified: !rt.isNew,
            }
          : rt,
      ),
    );
  };

  const removeRoomFromRoomType = (roomTypeIndex: number, roomIndex: number) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === roomTypeIndex
          ? {
              ...rt,
              rooms: rt.rooms.filter((_, ri) => ri !== roomIndex),
              totalRooms: Math.max(0, rt.totalRooms - 1),
              isModified: !rt.isNew,
            }
          : rt,
      ),
    );
  };

  const updateRoomData = (
    roomTypeIndex: number,
    roomIndex: number,
    field: keyof RoomData,
    value: string | number,
  ) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === roomTypeIndex
          ? {
              ...rt,
              rooms: rt.rooms.map((room, ri) =>
                ri === roomIndex ? { ...room, [field]: value } : room,
              ),
              isModified: !rt.isNew,
            }
          : rt,
      ),
    );
  };

  const clearAllRooms = (roomTypeIndex: number) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === roomTypeIndex ? { ...rt, rooms: [], isModified: !rt.isNew } : rt,
      ),
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageFormData[] = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
      isNew: true,
    }));
    setImages([...images, ...newImages]);
  };

  const removeImageForm = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setImageAsPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    );
  };

  const validateBasicInfo = () => {
    if (!basicInfo.name.trim()) return "Hostel name is required";
    if (!basicInfo.description.trim()) return "Description is required";
    if (!basicInfo.address.trim()) return "Address is required";
    if (!basicInfo.totalRooms || parseInt(basicInfo.totalRooms) < 1)
      return "Total rooms must be at least 1";
    return null;
  };

  const validateRoomTypes = () => {
    if (roomTypes.length === 0) return "At least one room type is required";

    const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
    const totalConfigured = getTotalRoomsConfigured();

    if (totalConfigured > totalAllowed) {
      return `You have configured ${totalConfigured} rooms but only ${totalAllowed} are allowed. Please adjust your room types.`;
    }

    if (totalConfigured < totalAllowed) {
      return `You have only configured ${totalConfigured} of ${totalAllowed} rooms. Please add more rooms or adjust the total in Basic Info.`;
    }

    for (const rt of roomTypes) {
      if (rt.pricePerPerson <= 0) return "All room types must have a price";
      if (rt.rooms.length === 0)
        return `${getOccupancyOption(rt.occupancyType).label} must have at least one room`;

      const roomNumbers = rt.rooms.map((r) => r.roomNumber);
      const uniqueNumbers = new Set(roomNumbers);
      if (uniqueNumbers.size !== roomNumbers.length) {
        return `${getOccupancyOption(rt.occupancyType).label} has duplicate room numbers`;
      }

      if (rt.rooms.some((r) => !r.roomNumber.trim())) {
        return `All rooms in ${getOccupancyOption(rt.occupancyType).label} must have room numbers`;
      }
    }

    return null;
  };

  const validatePayment = () => {
    if (!paymentInfo.accountName.trim()) return "Account name is required";
    if (!paymentInfo.momoNumber.trim())
      return "Mobile money number is required";
    return null;
  };

  const handleCreateHostel = async () => {
    const basicError = validateBasicInfo();
    if (basicError) {
      showToast(basicError, "error");
      setCurrentStep("basic");
      return;
    }

    const roomError = validateRoomTypes();
    if (roomError) {
      showToast(roomError, "error");
      setCurrentStep("rooms");
      return;
    }

    const paymentError = validatePayment();
    if (paymentError) {
      showToast(paymentError, "error");
      setCurrentStep("payment");
      return;
    }

    try {
      const payload: CreateHostelPayload = {
        name: basicInfo.name.trim(),
        description: basicInfo.description.trim(),
        address: basicInfo.address.trim(),
        distanceToCampus: basicInfo.distanceToCampus
          ? parseFloat(basicInfo.distanceToCampus)
          : undefined,
        totalRooms: parseInt(basicInfo.totalRooms),
        pricingPeriod: basicInfo.pricingPeriod,
        allowSemesterPayment: basicInfo.allowSemesterPayment,
        facilities: selectedFacilities,
        roomTypes: roomTypes.map((rt) => ({
          occupancyType: rt.occupancyType,
          pricePerPerson: rt.pricePerPerson,
          totalRooms: rt.rooms.length,
          amenities: rt.amenities,
          description: rt.description || undefined,
          rooms: rt.rooms.map((room) => ({
            roomNumber: room.roomNumber.trim(),
            floor: room.floor,
            notes: room.notes?.trim() || undefined,
          })),
        })),
        paymentDetail: {
          accountName: paymentInfo.accountName.trim(),
          momoNumber: paymentInfo.momoNumber.trim(),
          momoProvider: paymentInfo.momoProvider,
          alternatePhone: paymentInfo.alternatePhone.trim() || undefined,
          notes: paymentInfo.notes.trim() || undefined,
        },
      };

      const newHostel = await createHostel(payload);

      const newImages = images.filter((img) => img.isNew && img.file);
      if (newImages.length > 0) {
        try {
          await addImages(
            newHostel.id,
            newImages.map((img) => img.file!),
          );
          showToast(
            "Hostel created successfully with images! It will be reviewed by admin.",
            "success",
          );
        } catch (imageError) {
          console.error("Image upload failed:", imageError);
          showToast(
            "Hostel created successfully, but some images failed to upload. You can add them later.",
            "success",
          );
        }
      } else {
        showToast(
          "Hostel created successfully! It will be reviewed by admin before going live.",
          "success",
        );
      }

      setTimeout(() => {
        router.push("/manager/hostels");
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create hostel";
      showToast(message, "error");
    }
  };

  const handleUpdateHostel = async () => {
    if (!hostelId) return;

    const basicError = validateBasicInfo();
    if (basicError) {
      showToast(basicError, "error");
      setCurrentStep("basic");
      return;
    }

    const paymentError = validatePayment();
    if (paymentError) {
      showToast(paymentError, "error");
      setCurrentStep("payment");
      return;
    }

    try {
      const payload: UpdateHostelPayload = {
        name: basicInfo.name.trim(),
        description: basicInfo.description.trim(),
        address: basicInfo.address.trim(),
        distanceToCampus: basicInfo.distanceToCampus
          ? parseFloat(basicInfo.distanceToCampus)
          : undefined,
        totalRooms: parseInt(basicInfo.totalRooms),
        pricingPeriod: basicInfo.pricingPeriod,
        allowSemesterPayment: basicInfo.allowSemesterPayment,
      };

      await updateHostel(hostelId, payload);

      for (const rt of roomTypes) {
        if (rt.isNew) {
          await addRoomType(hostelId, {
            occupancyType: rt.occupancyType,
            pricePerPerson: rt.pricePerPerson,
            totalRooms: rt.rooms.length,
            amenities: rt.amenities,
            description: rt.description || undefined,
            rooms: rt.rooms,
          });
        } else if (rt.isModified && rt.id) {
          await updateRoomType(hostelId, rt.id, {
            pricePerPerson: rt.pricePerPerson,
            amenities: rt.amenities,
            description: rt.description || undefined,
          });
        }
      }

      const currentFacilityNames =
        initialData?.facilities?.map((f) => f.name.toLowerCase()) || [];
      const facilitiesToAdd = selectedFacilities.filter(
        (f) => !currentFacilityNames.includes(f),
      );
      const facilitiesToRemove =
        initialData?.facilities?.filter(
          (f) => !selectedFacilities.includes(f.name.toLowerCase()),
        ) || [];

      if (facilitiesToAdd.length > 0) {
        await addFacilities(hostelId, facilitiesToAdd);
      }

      for (const facility of facilitiesToRemove) {
        await removeFacility(hostelId, facility.id);
      }

      await upsertPaymentDetail(hostelId, {
        accountName: paymentInfo.accountName.trim(),
        momoNumber: paymentInfo.momoNumber.trim(),
        momoProvider: paymentInfo.momoProvider,
        alternatePhone: paymentInfo.alternatePhone.trim() || undefined,
        notes: paymentInfo.notes.trim() || undefined,
      });

      const newImages = images.filter((img) => img.isNew && img.file);
      if (newImages.length > 0) {
        await addImages(
          hostelId,
          newImages.map((img) => img.file!),
        );
      }

      const currentImageIds = images
        .filter((img) => !img.isNew && img.id)
        .map((img) => img.id);
      const deletedImages =
        initialData?.images?.filter(
          (img) => !currentImageIds.includes(img.id),
        ) || [];

      for (const img of deletedImages) {
        await removeImage(hostelId, img.id);
      }

      showToast("Hostel updated successfully!", "success");

      setTimeout(() => {
        router.push(`/manager/hostels/${hostelId}`);
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update hostel";
      showToast(message, "error");
    }
  };

  const handleSubmit = () => {
    if (isEditing) {
      handleUpdateHostel();
    } else {
      handleCreateHostel();
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hostel Name *
          </label>
          <input
            type="text"
            value={basicInfo.name}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, name: e.target.value })
            }
            placeholder="e.g., Sunrise Hostel"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description *
          </label>
          <textarea
            value={basicInfo.description}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, description: e.target.value })
            }
            placeholder="Describe your hostel, its features, and what makes it unique..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            value={basicInfo.address}
            onChange={(e) =>
              setBasicInfo({ ...basicInfo, address: e.target.value })
            }
            placeholder="Full address of the hostel"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Distance to Campus (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={basicInfo.distanceToCampus}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, distanceToCampus: e.target.value })
              }
              placeholder="e.g., 0.5"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Rooms *
            </label>
            <input
              type="number"
              value={basicInfo.totalRooms}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, totalRooms: e.target.value })
              }
              placeholder="e.g., 50"
              min="1"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Pricing Period
          </label>
          <select
            value={basicInfo.pricingPeriod}
            onChange={(e) =>
              setBasicInfo({
                ...basicInfo,
                pricingPeriod: e.target.value as PricingPeriod,
              })
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white transition-all"
          >
            <option value="PER_SEMESTER">Per Semester</option>
            <option value="PER_YEAR">Per Academic Year</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            This determines how prices will be displayed for room types
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <input
            type="checkbox"
            id="allowSemesterPayment"
            checked={basicInfo.allowSemesterPayment}
            onChange={(e) =>
              setBasicInfo({
                ...basicInfo,
                allowSemesterPayment: e.target.checked,
              })
            }
            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="allowSemesterPayment"
            className="text-sm text-slate-700"
          >
            Allow semester payment option
          </label>
        </div>
      </div>
    </div>
  );

  const renderRoomTypesStep = () => {
    const totalAllowed = parseInt(basicInfo.totalRooms) || 0;
    const totalConfigured = getTotalRoomsConfigured();
    const remaining = getRemainingRoomsAllowed();
    const isOverLimit = totalConfigured > totalAllowed;
    const isAtLimit = totalConfigured === totalAllowed && totalAllowed > 0;

    return (
      <div className="space-y-6">
        {totalAllowed > 0 && (
          <div
            className={cn(
              "rounded-xl p-4 border",
              isOverLimit
                ? "bg-red-50 border-red-200"
                : isAtLimit
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-50 border-slate-200",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Room Allocation
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-bold",
                  isOverLimit
                    ? "text-red-600"
                    : isAtLimit
                      ? "text-green-600"
                      : "text-slate-700",
                )}
              >
                {totalConfigured} / {totalAllowed}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isOverLimit
                    ? "bg-red-500"
                    : isAtLimit
                      ? "bg-green-500"
                      : "bg-primary-500",
                )}
                style={{
                  width: `${Math.min(100, (totalConfigured / totalAllowed) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                {isOverLimit ? (
                  <span className="text-red-600 font-medium">
                    {totalConfigured - totalAllowed} rooms over limit!
                  </span>
                ) : isAtLimit ? (
                  <span className="text-green-600 font-medium">
                    All rooms allocated ✓
                  </span>
                ) : (
                  <span>
                    {remaining} room{remaining !== 1 ? "s" : ""} remaining
                  </span>
                )}
              </p>
              {!isAtLimit && !isOverLimit && remaining > 0 && (
                <p className="text-xs text-slate-400">
                  Distribute across room types below
                </p>
              )}
            </div>
          </div>
        )}

        {totalAllowed === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Set Total Rooms First
              </p>
              <p className="text-sm text-amber-600 mt-1">
                Go back to Basic Info and set the total number of rooms for your
                hostel before configuring room types.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep("basic")}
                className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Go to Basic Info
              </Button>
            </div>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Bed className="w-5 h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-primary-900">
                How Room Types Work
              </h4>
              <p className="text-sm text-primary-700 mt-1">
                1. Select a room type (Single, Double, etc.)
                <br />
                2. Enter the total number of rooms and price
                <br />
                3. Click &quot;Generate Room Numbers&quot; to auto-create room
                identifiers
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Room Types</h3>
            <p className="text-sm text-slate-500">
              {roomTypes.length === 0
                ? "Add your first room type to get started"
                : `${roomTypes.length} room type${roomTypes.length > 1 ? "s" : ""} configured`}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={addNewRoomType}
            disabled={roomTypes.length >= 4 || !canAddMoreRooms()}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room Type
          </Button>
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Bed className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-2">
              No Room Types Yet
            </h4>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto px-4">
              Add room types to define your hostel&apos;s accommodation options
              and pricing
            </p>
            <Button variant="primary" onClick={addNewRoomType}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Room Type
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {roomTypes.map((rt, rtIndex) => {
              const occupancyOption = getOccupancyOption(rt.occupancyType);
              const totalCapacity = rt.rooms.length * occupancyOption.persons;
              const potentialRevenue = rt.pricePerPerson * totalCapacity;
              const hasRooms = rt.rooms.length > 0;
              const roomsMatchTotal = rt.rooms.length === rt.totalRooms;

              return (
                <motion.div
                  key={rt.id || rtIndex}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      rt.isExpanded ? "border-b border-slate-100" : "",
                    )}
                    onClick={() => toggleRoomTypeExpanded(rtIndex)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                              {occupancyOption.label}
                            </h4>
                            {rt.isNew && (
                              <Badge variant="primary" size="sm">
                                New
                              </Badge>
                            )}
                            {hasRooms && (
                              <Badge variant="success" size="sm">
                                {rt.rooms.length} rooms
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                            {occupancyOption.description}
                            {rt.pricePerPerson > 0 && (
                              <span className="text-primary-600 font-medium ml-1 sm:ml-2">
                                • GHS {rt.pricePerPerson.toLocaleString()}
                                {
                                  PRICING_PERIOD_SHORT_LABELS[
                                    basicInfo.pricingPeriod
                                  ]
                                }
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRoomTypeForm(rtIndex);
                          }}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-1.5 sm:p-2 text-slate-400">
                          {rt.isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {rt.isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                                1
                              </div>
                              <h5 className="font-medium text-slate-800">
                                Basic Information
                              </h5>
                            </div>

                            <div className="grid gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                  Room Type
                                </label>
                                <select
                                  value={rt.occupancyType}
                                  onChange={(e) =>
                                    updateRoomTypeForm(
                                      rtIndex,
                                      "occupancyType",
                                      e.target.value as OccupancyType,
                                    )
                                  }
                                  disabled={!rt.isNew}
                                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  {OCCUPANCY_OPTIONS.map((opt) => (
                                    <option
                                      key={opt.type}
                                      value={opt.type}
                                      disabled={
                                        !rt.isNew &&
                                        roomTypes.some(
                                          (other, i) =>
                                            i !== rtIndex &&
                                            other.occupancyType === opt.type,
                                        )
                                      }
                                    >
                                      {opt.label} ({opt.persons} person
                                      {opt.persons > 1 ? "s" : ""})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                    Number of Rooms *
                                    <InfoTooltip
                                      text={`Max: ${
                                        (parseInt(basicInfo.totalRooms) || 0) -
                                        roomTypes.reduce(
                                          (sum, rt, idx) =>
                                            idx !== rtIndex
                                              ? sum + rt.rooms.length
                                              : sum,
                                          0,
                                        )
                                      } rooms available`}
                                    />
                                  </label>
                                  <input
                                    type="number"
                                    value={rt.totalRooms || ""}
                                    onChange={(e) =>
                                      updateRoomTypeForm(
                                        rtIndex,
                                        "totalRooms",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    min="1"
                                    max={
                                      (parseInt(basicInfo.totalRooms) || 0) -
                                      roomTypes.reduce(
                                        (sum, rt, idx) =>
                                          idx !== rtIndex
                                            ? sum + rt.rooms.length
                                            : sum,
                                        0,
                                      )
                                    }
                                    placeholder="e.g., 10"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {(() => {
                                      const maxForType =
                                        (parseInt(basicInfo.totalRooms) || 0) -
                                        roomTypes.reduce(
                                          (sum, rt, idx) =>
                                            idx !== rtIndex
                                              ? sum + rt.rooms.length
                                              : sum,
                                          0,
                                        );
                                      return `Max ${maxForType} rooms available`;
                                    })()}
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                    Price/Person (GHS) *
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={rt.pricePerPerson || ""}
                                      onChange={(e) =>
                                        updateRoomTypeForm(
                                          rtIndex,
                                          "pricePerPerson",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      min="0"
                                      placeholder="2500"
                                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                                  Description (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={rt.description}
                                  onChange={(e) =>
                                    updateRoomTypeForm(
                                      rtIndex,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Brief description of this room type..."
                                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                                2
                              </div>
                              <h5 className="font-medium text-slate-800">
                                Room Numbers
                              </h5>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                              <div className="flex flex-col gap-3">
                                <div>
                                  <p className="font-medium text-slate-700 text-sm">
                                    {hasRooms
                                      ? `${rt.rooms.length} room${rt.rooms.length > 1 ? "s" : ""} generated`
                                      : "Generate room numbers automatically"}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {hasRooms
                                      ? "Click to regenerate or edit individually"
                                      : `Will create ${rt.totalRooms || 0} rooms`}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {hasRooms && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => clearAllRooms(rtIndex)}
                                      className="flex-1"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                      Clear
                                    </Button>
                                  )}
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => autoGenerateRooms(rtIndex)}
                                    disabled={
                                      !rt.totalRooms || rt.totalRooms <= 0
                                    }
                                    className="flex-1"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                    {hasRooms ? "Regenerate" : "Generate"}
                                  </Button>
                                </div>
                              </div>

                              {hasRooms && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <button
                                      onClick={() =>
                                        toggleShowRoomDetails(rtIndex)
                                      }
                                      className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      {rt.showRoomDetails
                                        ? "Hide"
                                        : "Edit"}{" "}
                                      details
                                      {rt.showRoomDetails ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => addRoomToRoomType(rtIndex)}
                                      className="text-xs sm:text-sm text-slate-600 hover:text-primary-600 font-medium flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add
                                    </button>
                                  </div>

                                  {!rt.showRoomDetails && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                      {rt.rooms.slice(0, 8).map((room, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                                        >
                                          {room.roomNumber}
                                        </span>
                                      ))}
                                      {rt.rooms.length > 8 && (
                                        <span className="px-2 py-1 bg-primary-50 border border-primary-100 rounded-lg text-xs font-medium text-primary-600">
                                          +{rt.rooms.length - 8} more
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <AnimatePresence>
                                    {rt.showRoomDetails && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-2">
                                          {rt.rooms.map((room, roomIndex) => (
                                            <div
                                              key={roomIndex}
                                              className="group relative bg-white border border-slate-200 rounded-lg p-2 hover:border-primary-200 transition-colors"
                                            >
                                              <button
                                                onClick={() =>
                                                  removeRoomFromRoomType(
                                                    rtIndex,
                                                    roomIndex,
                                                  )
                                                }
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                                              >
                                                <X className="w-2.5 h-2.5" />
                                              </button>

                                              <input
                                                type="text"
                                                value={room.roomNumber}
                                                onChange={(e) =>
                                                  updateRoomData(
                                                    rtIndex,
                                                    roomIndex,
                                                    "roomNumber",
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="#"
                                                className="w-full px-1.5 py-1 text-xs font-medium text-center border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                                              />

                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[9px] text-slate-400">
                                                  F:
                                                </span>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={room.floor}
                                                  onChange={(e) =>
                                                    updateRoomData(
                                                      rtIndex,
                                                      roomIndex,
                                                      "floor",
                                                      parseInt(
                                                        e.target.value,
                                                      ) || 1,
                                                    )
                                                  }
                                                  className="flex-1 px-1 py-0.5 text-[9px] border border-slate-200 rounded text-center w-full"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>

                            {rt.totalRooms > 0 &&
                              hasRooms &&
                              !roomsMatchTotal && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-700">
                                    You have {rt.rooms.length} rooms but
                                    specified {rt.totalRooms}. Click
                                    &quot;Regenerate&quot; to match.
                                  </p>
                                </div>
                              )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                                3
                              </div>
                              <h5 className="font-medium text-slate-800">
                                Room Amenities
                              </h5>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {ROOM_AMENITY_OPTIONS.map((amenity) => (
                                <button
                                  key={amenity.name}
                                  type="button"
                                  onClick={() => {
                                    const current = rt.amenities;
                                    const updated = current.includes(
                                      amenity.name,
                                    )
                                      ? current.filter(
                                          (a) => a !== amenity.name,
                                        )
                                      : [...current, amenity.name];
                                    updateRoomTypeForm(
                                      rtIndex,
                                      "amenities",
                                      updated,
                                    );
                                  }}
                                  className={cn(
                                    "px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border transition-all flex items-center gap-1.5",
                                    rt.amenities.includes(amenity.name)
                                      ? "bg-primary-50 border-primary-200 text-primary-700"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-primary-200",
                                  )}
                                >
                                  <span className="text-sm">
                                    {amenity.icon}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {amenity.name}
                                  </span>
                                  {rt.amenities.includes(amenity.name) && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {rt.pricePerPerson > 0 && rt.rooms.length > 0 && (
                            <div className="bg-linear-to-r from-primary-50 to-primary-100/50 rounded-xl p-4 border border-primary-100">
                              <h6 className="text-sm font-semibold text-primary-800 mb-3">
                                Revenue Summary
                              </h6>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/60 rounded-lg p-2.5 sm:p-3">
                                  <p className="text-[10px] sm:text-xs text-primary-600">
                                    Total Rooms
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-primary-900">
                                    {rt.rooms.length}
                                  </p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2.5 sm:p-3">
                                  <p className="text-[10px] sm:text-xs text-primary-600">
                                    Student Capacity
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-primary-900">
                                    {totalCapacity}
                                  </p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2.5 sm:p-3">
                                  <p className="text-[10px] sm:text-xs text-primary-600">
                                    Price/Person
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-primary-900">
                                    GHS {rt.pricePerPerson.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-2.5 sm:p-3">
                                  <p className="text-[10px] sm:text-xs text-primary-600">
                                    Max Revenue
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-green-600">
                                    GHS {potentialRevenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {roomTypes.length > 0 && roomTypes.length < 4 && canAddMoreRooms() && (
          <button
            onClick={addNewRoomType}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">
              Add Another Room Type ({remaining} room
              {remaining !== 1 ? "s" : ""} remaining)
            </span>
          </button>
        )}
      </div>
    );
  };

  const renderFacilitiesStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-slate-800 mb-2">Hostel Facilities</h3>
        <p className="text-sm text-slate-500 mb-4">
          Select the facilities available at your hostel
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {FACILITY_OPTIONS.map((facility) => {
            const isSelected = selectedFacilities.includes(facility.id);
            return (
              <button
                key={facility.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedFacilities((prev) =>
                      prev.filter((f) => f !== facility.id),
                    );
                  } else {
                    setSelectedFacilities((prev) => [...prev, facility.id]);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? "bg-primary-50 border-primary-200 text-primary-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary-200",
                )}
              >
                <facility.icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">
                  {facility.label}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-slate-800 mb-2">Payment Details</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add your mobile money details for receiving payments
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Platform Service Fee
          </p>
          <p className="text-sm text-amber-700 mt-1">
            A 2% service fee is added to the student&apos;s payment. You receive
            the full amount you set.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={paymentInfo.accountName}
              onChange={(e) =>
                setPaymentInfo({ ...paymentInfo, accountName: e.target.value })
              }
              placeholder="Name on MoMo account"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Money Number *
            </label>
            <input
              type="tel"
              value={paymentInfo.momoNumber}
              onChange={(e) =>
                setPaymentInfo({ ...paymentInfo, momoNumber: e.target.value })
              }
              placeholder="e.g., 0241234567"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              MoMo Provider
            </label>
            <select
              value={paymentInfo.momoProvider}
              onChange={(e) =>
                setPaymentInfo({ ...paymentInfo, momoProvider: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="MTN">MTN Mobile Money</option>
              <option value="VODAFONE">Vodafone Cash</option>
              <option value="AIRTELTIGO">AirtelTigo Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alternate Phone
            </label>
            <input
              type="tel"
              value={paymentInfo.alternatePhone}
              onChange={(e) =>
                setPaymentInfo({
                  ...paymentInfo,
                  alternatePhone: e.target.value,
                })
              }
              placeholder="Optional backup number"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Payment Notes
          </label>
          <textarea
            value={paymentInfo.notes}
            onChange={(e) =>
              setPaymentInfo({ ...paymentInfo, notes: e.target.value })
            }
            placeholder="Any additional payment instructions for students..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-800">
            How Payments Work
          </p>
          <ul className="text-sm text-green-700 mt-1 space-y-1 list-disc list-inside">
            <li>Students pay online via Mobile Money</li>
            <li>Your full price is disbursed after admin approval</li>
            <li>You&apos;ll receive a notification when funds are sent</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderImagesStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-slate-800 mb-2">Hostel Images</h3>
        <p className="text-sm text-slate-500 mb-4">
          Upload photos of your hostel. The first image will be the primary
          display image.
        </p>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-primary-300 hover:bg-primary-50/30 transition-all">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">
            Click to upload images
          </p>
          <p className="text-xs text-slate-400">PNG, JPG up to 5MB each</p>
        </label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((img, index) => (
            <div
              key={img.id || index}
              className={cn(
                "relative group rounded-xl overflow-hidden border-2 transition-all aspect-square",
                img.isPrimary
                  ? "border-primary-500 ring-2 ring-primary-200"
                  : "border-slate-200",
              )}
            >
              <div className="w-full h-full bg-slate-100 relative">
                {img.preview ? (
                  <Image
                    fill
                    src={img.preview}
                    alt={`Hostel image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>

              {img.isPrimary && (
                <div className="absolute top-2 left-2">
                  <Badge variant="primary" size="sm">
                    Primary
                  </Badge>
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    onClick={() => setImageAsPrimary(index)}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-primary-50"
                    title="Set as primary"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => removeImageForm(index)}
                  className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <MobileStepIndicator
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
      />

      <DesktopStepIndicator
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === "basic" && renderBasicInfoStep()}
            {currentStep === "rooms" && renderRoomTypesStep()}
            {currentStep === "facilities" && renderFacilitiesStep()}
            {currentStep === "payment" && renderPaymentStep()}
            {currentStep === "images" && renderImagesStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={currentStepIndex === 0 || isSubmitting}
          size="sm"
          className="px-3 sm:px-4"
        >
          <ChevronLeft className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            size="sm"
            className="px-3 sm:px-4"
          >
            Cancel
          </Button>

          {currentStepIndex < STEPS.length - 1 ? (
            <Button
              onClick={goToNextStep}
              disabled={isSubmitting}
              size="sm"
              className="px-3 sm:px-4"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Continue</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="px-3 sm:px-4"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {isEditing ? "Save Changes" : "Submit"}
                  </span>
                  <span className="sm:hidden">
                    {isEditing ? "Save" : "Submit"}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-800">Review Process</p>
            <p className="text-sm text-blue-600 mt-1">
              After submission, your hostel will be reviewed by our admin team.
              You&apos;ll receive a notification once approved.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
