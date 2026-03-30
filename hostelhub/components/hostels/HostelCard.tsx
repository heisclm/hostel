"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  MapPin,
  Star,
  Heart,
  Wifi,
  Car,
  Zap,
  Droplets,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency, getDistanceLabel } from "@/lib/utils";
import type { Hostel } from "@/types";

interface HostelCardProps {
  hostel: Hostel;
  variant?: "default" | "horizontal";
  showCompare?: boolean;
  onCompare?: (hostel: Hostel) => void;
  isComparing?: boolean;
}

const facilityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  electricity: Zap,
  water: Droplets,
  security: Shield,
};

export function HostelCard({
  hostel,
  variant = "default",
  showCompare = false,
  onCompare,
  isComparing = false,
}: HostelCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const lowestPrice =
    hostel.rooms.length > 0 ? Math.min(...hostel.rooms.map((r) => r.price)) : 0;

  const totalAvailable = hostel.rooms.reduce((sum, r) => sum + r.available, 0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === hostel.images.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? hostel.images.length - 1 : prev - 1,
    );
  };

  if (variant === "horizontal") {
    return (
      <Card
        hover
        padding="none"
        className="flex flex-col sm:flex-row overflow-hidden"
      >
        <div className="relative w-full sm:w-72 h-48 sm:h-auto shrink-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600">
            {hostel.images.length > 0 && (
              <Image
                src={hostel.images[currentImageIndex]}
                alt={hostel.name}
                fill
                className="object-cover"
              />
            )}
          </div>

          {hostel.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hostel.verified && (
              <Badge
                variant="success"
                size="sm"
                icon={<Shield className="w-3 h-3" />}
              >
                Verified
              </Badge>
            )}
            {totalAvailable > 0 && totalAvailable <= 5 && (
              <Badge variant="warning" size="sm">
                Only {totalAvailable} left
              </Badge>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="absolute cursor-pointer top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isLiked ? "fill-red-500 text-red-500" : "text-slate-600",
              )}
            />
          </button>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <Link href={`/hostels/${hostel.id}`}>
                <h3 className="text-lg font-semibold text-slate-800 hover:text-primary-600 transition-colors">
                  {hostel.name}
                </h3>
              </Link>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {getDistanceLabel(hostel.distanceFromCampus)}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
              <span className="font-semibold text-sm">{hostel.rating}</span>
              <span className="text-slate-500 text-xs">
                ({hostel.reviewCount})
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-sm line-clamp-2 mb-4">
            {hostel.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {hostel.facilities.slice(0, 4).map((facility) => {
              const Icon = facilityIcons[facility.icon] || Shield;
              return (
                <span
                  key={facility.id}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {facility.name}
                </span>
              );
            })}
            {hostel.facilities.length > 4 && (
              <span className="text-xs text-slate-500 px-2 py-1">
                +{hostel.facilities.length - 4} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500">Starting from</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(lowestPrice)}
                </span>
                <span className="text-slate-500 text-sm">/semester</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showCompare && (
                <Button
                  variant={isComparing ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onCompare?.(hostel)}
                >
                  {isComparing ? "Comparing" : "Compare"}
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/hostels/${hostel.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card hover padding="none" className="overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600">
          {hostel.images.length > 0 && (
            <Image
              src={hostel.images[currentImageIndex]}
              alt={hostel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        {hostel.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {hostel.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex(index);
                }}
                className={cn(
                  "w-2 h-2 cursor-pointer rounded-full transition-all",
                  index === currentImageIndex
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/75",
                )}
              />
            ))}
          </div>
        )}

        {hostel.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hostel.verified && (
            <Badge
              variant="success"
              size="sm"
              icon={<Shield className="w-3 h-3" />}
            >
              Verified
            </Badge>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute cursor-pointer top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isLiked ? "fill-red-500 text-red-500" : "text-slate-600",
            )}
          />
        </button>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
          <span className="font-semibold text-sm">{hostel.rating}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <Link href={`/hostels/${hostel.id}`}>
            <h3 className="text-lg font-semibold text-slate-800 hover:text-primary-600 transition-colors line-clamp-1">
              {hostel.name}
            </h3>
          </Link>
          <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" />
            {getDistanceLabel(hostel.distanceFromCampus)}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {hostel.facilities.slice(0, 3).map((facility) => {
            const Icon = facilityIcons[facility.icon] || Shield;
            return (
              <div
                key={facility.id}
                className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"
                title={facility.name}
              >
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
            );
          })}
          {hostel.facilities.length > 3 && (
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-medium text-slate-500">
              +{hostel.facilities.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            {totalAvailable > 0 ? (
              <>
                <span className="text-secondary-600 font-medium">
                  {totalAvailable} rooms
                </span>{" "}
                available
              </>
            ) : (
              <span className="text-red-500">Fully booked</span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-500">From</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(lowestPrice)}
              </span>
              <span className="text-slate-500 text-xs">/sem</span>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/hostels/${hostel.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
