"use client"

import { useState } from "react"
import Link from "next/link"
import { VehicleFeature } from "@/lib/types/vehicle-feature"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { CustomPagination } from "@/components/ui/custom-pagination"

interface VehicleFeatureTableProps {
  features: VehicleFeature[]
  currentPage: number
  totalPages: number
  total: number
}

const categoryColors = {
  safety: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  comfort: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  convenience: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  performance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function VehicleFeatureTable({ features, currentPage, totalPages, total }: VehicleFeatureTableProps) {

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No features found
                </TableCell>
              </TableRow>
            ) : (
              features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{feature.name}</div>
                      {feature.description && (
                        <div className="text-sm text-muted-foreground">{feature.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {feature.category && (
                      <Badge className={categoryColors[feature.category as keyof typeof categoryColors] || "bg-gray-100"}>
                        {feature.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {feature.icon && (
                      <span className="text-sm text-muted-foreground">{feature.icon}</span>
                    )}
                  </TableCell>
                  <TableCell>{feature.sort_order}</TableCell>
                  <TableCell>
                    {feature.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/vendor/vehicle-features"
          />
        </div>
      )}
    </>
  )
}