"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Loader2,
  Building2,
  Users,
  Check,
  AlertCircle,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { bookingService, type AvailableRoom } from "@/services/booking.service";
import type { Booking } from "@/types/booking";

interface RoomAssignmentModalProps {
  booking: Booking;
  hostelId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function getOccupancyLabel(type: string): string {
  const labels: Record<string, string> = {
    IN_1: "1 in a Room",
    IN_2: "2 in a Room",
    IN_3: "3 in a Room",
    IN_4: "4 in a Room",
  };
  return labels[type] || type;
}

function getTenantName(booking: Booking): string {
  if (booking.booker) {
    return `${booking.booker.firstName} ${booking.booker.lastName}`;
  }
  return "Unknown Student";
}

export function RoomAssignmentModal({
  booking,
  hostelId,
  onClose,
  onSuccess,
  onError,
}: RoomAssignmentModalProps) {
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantName = getTenantName(booking);
  const roomTypeId = booking.roomTypeId;

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await bookingService.getAvailableRoomsForAssignment(
          hostelId,
          roomTypeId,
        );
        if (response.success) {
          setRooms(response.data);
          if (response.data.length === 0) {
            setError(
              "No rooms available for this room type. Please add rooms first.",
            );
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load rooms";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRooms();
  }, [hostelId, roomTypeId]);

  const handleAssign = async () => {
    if (!selectedRoomId) return;

    try {
      setAssigning(true);
      const response = await bookingService.assignStudentToRoom(
        hostelId,
        booking.id,
        selectedRoomId,
      );
      onSuccess(response.message || "Room assigned successfully!");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to assign room";
      onError(message);
    } finally {
      setAssigning(false);
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Assign Room</h2>
            <p className="text-sm text-slate-500">
              Select a room for {tenantName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{tenantName}</p>
              <p className="text-sm text-slate-500">
                {booking.bookingReference} •{" "}
                {getOccupancyLabel(booking.roomType.occupancyType)}
              </p>
            </div>
            <Badge variant="primary" size="sm">
              {booking.status}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
              <p className="text-sm text-slate-500">
                Loading available rooms...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <DoorOpen className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-sm text-amber-600 text-center">
                No rooms available for this room type
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Add rooms to this room type first
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Available Rooms ({rooms.length})
              </p>
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left",
                    selectedRoomId === room.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-slate-200 hover:border-slate-300 bg-white",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          selectedRoomId === room.id
                            ? "bg-primary-500 text-white"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          Room {room.roomNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          {room.floor ? `Floor ${room.floor}` : "Ground Floor"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          {room.currentOccupancy}/{room.maxOccupancy}
                        </span>
                      </div>
                      <Badge
                        variant={
                          room.availableSlots > 1 ? "success" : "warning"
                        }
                        size="sm"
                        className="mt-1"
                      >
                        {room.availableSlots} slot
                        {room.availableSlots !== 1 ? "s" : ""} left
                      </Badge>
                    </div>
                  </div>
                  {selectedRoomId === room.id && (
                    <div className="mt-3 pt-3 border-t border-primary-200 flex items-center gap-2 text-primary-700 text-sm">
                      <Check className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedRoomId || assigning}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Assign to Room {selectedRoom?.roomNumber || ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
