"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar as CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
  provider: z.string().min(1, "Please select a provider"),
  notes: z.string().optional(),
})

export default function ScheduleAppointmentPage() {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // TODO: Implement appointment creation API call
      console.log(values)
      toast({
        title: "Appointment scheduled",
        description: "Your appointment has been scheduled successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error scheduling your appointment.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Schedule an Appointment</h1>
          <p className="text-muted-foreground">Fill out the form below to schedule a new appointment</p>
        </div>
        <Button 
          className="w-full sm:w-auto"
          variant="outline" 
          onClick={() => window.location.href = "/patient"}
        >
          Return to Dashboard
        </Button>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="- Select -" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual Gynecology Visit">Annual Gynecology Visit</SelectItem>
                        <SelectItem value="Annual Physical">Annual Physical</SelectItem>
                        <SelectItem value="Behavioral Health">Behavioral Health</SelectItem>
                        <SelectItem value="Consult/Referral">Consult/Referral</SelectItem>
                        <SelectItem value="First Prenatal Appointment">First Prenatal Appointment</SelectItem>
                        <SelectItem value="Flu Shot Visit">Flu Shot Visit</SelectItem>
                        <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                        <SelectItem value="Imaging">Imaging</SelectItem>
                        <SelectItem value="Lab Work">Lab Work</SelectItem>
                        <SelectItem value="Medicare Annual Wellness Visit">Medicare Annual Wellness Visit</SelectItem>
                        <SelectItem value="Medication Check">Medication Check</SelectItem>
                        <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                        <SelectItem value="Problem">Problem</SelectItem>
                        <SelectItem value="Secure Online Video Appointment">Secure Online Video Appointment</SelectItem>
                        <SelectItem value="Sick Visit">Sick Visit</SelectItem>
                        <SelectItem value="Well Child Visit">Well Child Visit</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Dr. Smith</SelectItem>
                      <SelectItem value="2">Dr. Johnson</SelectItem>
                      <SelectItem value="3">Dr. Williams</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    className="rounded-md border"
                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00">2:00 PM</SelectItem>
                      <SelectItem value="15:00">3:00 PM</SelectItem>
                      <SelectItem value="16:00">4:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information you'd like to share"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional: Include any relevant information for your visit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col xs:flex-row xs:justify-end gap-3">
              <Button 
                className="w-full xs:w-auto order-2 xs:order-1"
                type="button" 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button 
                className="w-full xs:w-auto order-1 xs:order-2"
                type="submit"
              >
                Schedule Appointment
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}