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
import type { MedicalRecordQuery, MedicalRecordReport } from "@/lib/types"

export default function MedicalRecordsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<MedicalRecordReport | null>(null)
  const [query, setQuery] = useState<MedicalRecordQuery>({
    patientName: "",
    diagnosis: "",
    dateFrom: "",
    dateTo: "",
    symptoms: [],
    medications: [],
    doctorId: "",
  })

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

  const addMedication = (medication: string) => {
    if (medication.trim() && !query.medications?.includes(medication.trim())) {
      handleQueryChange("medications", [...(query.medications || []), medication.trim()])
    }
  }

  const removeMedication = (medication: string) => {
    handleQueryChange("medications", query.medications?.filter(m => m !== medication) || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"
      
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

      const res = await fetch(`${baseUrl}/doctor/medical-records/query?${searchParams}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to fetch medical records")
      }

      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error("Medical records query failed:", err)
      // For demo purposes, show sample data
      setReport(generateSampleReport(query))
    } finally {
      setIsLoading(false)
    }
  }

  const clearQuery = () => {
    setQuery({
      patientName: "",
      diagnosis: "",
      dateFrom: "",
      dateTo: "",
      symptoms: [],
      medications: [],
      doctorId: "",
    })
    setReport(null)
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
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    placeholder="Enter patient name..."
                    value={query.patientName}
                    onChange={(e) => handleQueryChange("patientName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    placeholder="Enter diagnosis..."
                    value={query.diagnosis}
                    onChange={(e) => handleQueryChange("diagnosis", e.target.value)}
                  />
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

                <div>
                  <Label>Medications</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add medication..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addMedication(e.currentTarget.value)
                          e.currentTarget.value = ""
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {query.medications?.map((medication) => (
                      <Badge
                        key={medication}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeMedication(medication)}
                      >
                        {medication} ×
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
          {report ? (
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

// Sample data generator for demonstration
function generateSampleReport(query: MedicalRecordQuery): MedicalRecordReport {
  const sampleRecords = [
    {
      id: "mr-1",
      patientId: "p-1",
      patientName: "John Smith",
      appointmentId: "apt-1",
      date: "2024-10-15",
      diagnosis: "Hypertension",
      symptoms: ["headache", "dizziness", "fatigue"],
      treatment: "Lifestyle modification and medication",
      medications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Daily", duration: "30 days" },
        { name: "Hydrochlorothiazide", dosage: "25mg", frequency: "Daily", duration: "30 days" }
      ],
      notes: "Patient shows good response to treatment. Follow-up in 4 weeks.",
      doctorId: "d-1",
      doctorName: "Sarah Johnson"
    },
    {
      id: "mr-2",
      patientId: "p-2",
      patientName: "Mary Davis",
      appointmentId: "apt-2",
      date: "2024-10-12",
      diagnosis: "Type 2 Diabetes",
      symptoms: ["increased thirst", "frequent urination", "blurred vision"],
      treatment: "Dietary counseling and medication initiation",
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days" }
      ],
      notes: "HbA1c: 8.2%. Patient counseled on diet and exercise. Diabetes educator referral.",
      doctorId: "d-1",
      doctorName: "Sarah Johnson"
    },
    {
      id: "mr-3",
      patientId: "p-3",
      patientName: "Robert Wilson",
      appointmentId: "apt-3",
      date: "2024-10-10",
      diagnosis: "Acute Bronchitis",
      symptoms: ["cough", "fever", "chest congestion"],
      treatment: "Symptomatic treatment and rest",
      medications: [
        { name: "Azithromycin", dosage: "250mg", frequency: "Daily", duration: "5 days" },
        { name: "Albuterol inhaler", dosage: "2 puffs", frequency: "As needed", duration: "30 days" }
      ],
      notes: "Viral bronchitis likely. Symptomatic treatment recommended. Return if worsening.",
      doctorId: "d-1",
      doctorName: "Sarah Johnson"
    }
  ]

  // Filter records based on query
  let filteredRecords = sampleRecords
  
  if (query.patientName) {
    filteredRecords = filteredRecords.filter(r => 
      r.patientName.toLowerCase().includes(query.patientName!.toLowerCase())
    )
  }
  
  if (query.diagnosis) {
    filteredRecords = filteredRecords.filter(r => 
      r.diagnosis.toLowerCase().includes(query.diagnosis!.toLowerCase())
    )
  }

  return {
    query,
    totalRecords: filteredRecords.length,
    records: filteredRecords,
    summary: {
      mostCommonDiagnosis: ["Hypertension", "Type 2 Diabetes", "Acute Bronchitis"],
      mostCommonSymptoms: ["headache", "cough", "fatigue", "dizziness"],
      mostPrescribedMedications: ["Lisinopril", "Metformin", "Azithromycin"],
      dateRange: {
        earliest: "2024-10-10",
        latest: "2024-10-15"
      }
    }
  }
}