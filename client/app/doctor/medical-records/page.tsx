"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Calendar, User, Pill, Stethoscope, TrendingUp, Filter } from "lucide-react"
import { apiPath } from "@/app/lib/api"
import type { MedicalRecordQuery, MedicalRecordReport } from "@/lib/types"

export default function MedicalRecordsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<MedicalRecordReport | null>(null)
  const [query, setQuery] = useState<MedicalRecordQuery>({
    patientFirstName: "",
    patientLastName: "",
    dateFrom: "",
    dateTo: "",
    symptoms: [],
    doctorId: "",
  })
  const [error, setError] = useState<string | null>(null)

  const handleQueryChange = (field: keyof MedicalRecordQuery, value: string | string[]) => {
    setQuery(prev => ({ ...prev, [field]: value }))
  }

  const addSymptom = (symptom: string) => {
    if (symptom.trim() && !query.symptoms?.includes(symptom.trim())) {
      handleQueryChange("symptoms", [...(query.symptoms || []), symptom.trim()])
    }
  }

  const removeSymptom = (symptom: string) => {
    handleQueryChange("symptoms", query.symptoms?.filter(s => s !== symptom) || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null

      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v))
          } else {
            searchParams.set(key, value.toString())
          }
        }
      })

      const queryString = searchParams.toString()
      const url = queryString
        ? `${apiPath("/doctor/medical-records/query")}?${queryString}`
        : apiPath("/doctor/medical-records/query")

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch medical records")
      }

      const data = await res.json()
      
      if (!data || !data.records || data.records.length === 0) {
        setError("No matching patient records found. Please refine your search criteria.")
        setReport(null)
      } else {
        setReport(data)
      }
    } catch (err) {
      console.error("Medical records query failed:", err)
      setError("No matching patient records found. Please refine your search criteria.")
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearQuery = () => {
    setQuery({
      patientFirstName: "",
      patientLastName: "",
      dateFrom: "",
      dateTo: "",
      symptoms: [],
      doctorId: "",
    })
    setReport(null)
    setError(null)
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Medical Records Query</h1>
        <p className="text-muted-foreground">
          Search and analyze patient medical records to generate comprehensive reports
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Query Parameters
              </CardTitle>
              <CardDescription>
                Specify criteria to filter medical records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="patientFirstName">First Name</Label>
                    <Input
                      id="patientFirstName"
                      placeholder="Enter first name..."
                      value={query.patientFirstName}
                      onChange={(e) => handleQueryChange("patientFirstName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientLastName">Last Name</Label>
                    <Input
                      id="patientLastName"
                      placeholder="Enter last name..."
                      value={query.patientLastName}
                      onChange={(e) => handleQueryChange("patientLastName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={query.dateFrom}
                      onChange={(e) => handleQueryChange("dateFrom", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={query.dateTo}
                      onChange={(e) => handleQueryChange("dateTo", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Symptoms</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add symptom..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSymptom(e.currentTarget.value)
                          e.currentTarget.value = ""
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {query.symptoms?.map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSymptom(symptom)}
                      >
                        {symptom} ×
                      </Badge>
                    ))}
                  </div>
                </div>



                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      "Searching..."
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Query Records
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearQuery}>
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {error ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-destructive">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : report ? (
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="records">Records ({report.totalRecords})</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Medical Records
                    </CardTitle>
                    <CardDescription>
                      {report.totalRecords} records found matching your criteria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {report.records.map((record) => (
                        <Card key={record.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{record.patientName}</CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(record.date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Dr. {record.doctorName}
                                  </span>
                                </CardDescription>
                              </div>
                              <Badge variant="outline">{record.diagnosis}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Symptoms</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {record.symptoms.map((symptom) => (
                                    <Badge key={symptom} variant="secondary" className="text-xs">
                                      {symptom}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">Treatment</Label>
                                <p className="text-sm text-muted-foreground mt-1">{record.treatment}</p>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">Medications</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                  {record.medications.map((med, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-sm">
                                      <Pill className="h-3 w-3 text-primary" />
                                      <span className="font-medium">{med.name}</span>
                                      <span className="text-muted-foreground">
                                        {med.dosage}, {med.frequency}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {record.notes && (
                                <div>
                                  <Label className="text-sm font-medium">Notes</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Stethoscope className="h-5 w-5" />
                        Top Diagnoses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.summary.mostCommonDiagnosis.map((diagnosis, idx) => (
                          <div key={diagnosis} className="flex items-center justify-between">
                            <span className="text-sm">{diagnosis}</span>
                            <Badge variant="outline">{idx + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5" />
                        Common Symptoms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.summary.mostCommonSymptoms.map((symptom, idx) => (
                          <div key={symptom} className="flex items-center justify-between">
                            <span className="text-sm">{symptom}</span>
                            <Badge variant="outline">{idx + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Pill className="h-5 w-5" />
                        Top Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.summary.mostPrescribedMedications.map((medication, idx) => (
                          <div key={medication} className="flex items-center justify-between">
                            <span className="text-sm">{medication}</span>
                            <Badge variant="outline">{idx + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Date Range
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Earliest</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(report.summary.dateRange.earliest).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Latest</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(report.summary.dateRange.latest).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Query Submitted</h3>
                  <p>Use the form on the left to query medical records and generate reports.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


