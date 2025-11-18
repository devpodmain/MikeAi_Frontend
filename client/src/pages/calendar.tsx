import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, ChevronLeft, ChevronRight, Plus,
  Clock, Users, MapPin, Video, Phone, MessageCircle
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");

  const appointments = [
    {
      id: 1,
      client: "Sarah Johnson",
      type: "Nutrition Consultation",
      time: "10:00 AM",
      duration: "45 min",
      date: "2025-01-28",
      status: "confirmed",
      meetingType: "video"
    },
    {
      id: 2,
      client: "Mike Chen",
      type: "Progress Review",
      time: "2:00 PM",
      duration: "30 min",
      date: "2025-01-28",
      status: "confirmed",
      meetingType: "in-person"
    },
    {
      id: 3,
      client: "Emma Davis",
      type: "Meal Planning",
      time: "4:00 PM",
      duration: "60 min",
      date: "2025-01-29",
      status: "pending",
      meetingType: "phone"
    },
    {
      id: 4,
      client: "James Wilson",
      type: "Initial Consultation",
      time: "11:00 AM",
      duration: "90 min",
      date: "2025-01-30",
      status: "confirmed",
      meetingType: "video"
    }
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/coach-home">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Calendar</h1>
              <p className="text-gray-300">Manage your coaching appointments and schedule</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {["day", "week", "month"].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={viewMode === mode 
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600" 
                    : "border-white/20 text-white hover:bg-white/10"
                  }
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-300">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((day, index) => {
                    const dayAppointments = day ? getAppointmentsForDate(day) : [];
                    const isToday = day === new Date().getDate() && 
                                   currentDate.getMonth() === new Date().getMonth() && 
                                   currentDate.getFullYear() === new Date().getFullYear();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border border-white/10 rounded-lg ${
                          day ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : 'bg-transparent'
                        } ${isToday ? 'ring-2 ring-cyan-400/50' : ''}`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isToday ? 'text-cyan-400' : 'text-white'
                            }`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 2).map((apt) => (
                                <div
                                  key={apt.id}
                                  className={`text-xs p-1 rounded truncate ${
                                    apt.status === 'confirmed' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}
                                >
                                  {apt.time} {apt.client.split(' ')[0]}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{dayAppointments.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.slice(0, 4).map((apt) => (
                    <div key={apt.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white">{apt.client}</h4>
                          <p className="text-sm text-gray-300">{apt.type}</p>
                        </div>
                        <Badge 
                          variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                          className={apt.status === 'confirmed' 
                            ? 'bg-green-500/20 text-green-400 border-green-400/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                          }
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {apt.time}
                        </div>
                        <div className="flex items-center">
                          {apt.meetingType === 'video' && <Video className="w-4 h-4 mr-1" />}
                          {apt.meetingType === 'phone' && <Phone className="w-4 h-4 mr-1" />}
                          {apt.meetingType === 'in-person' && <MapPin className="w-4 h-4 mr-1" />}
                          {apt.duration}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        {apt.meetingType === 'video' && (
                          <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                            <Video className="w-3 h-3 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Quick Stats */}
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Total Appointments</span>
                    <span className="text-cyan-400 font-bold">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Hours Booked</span>
                    <span className="text-green-400 font-bold">1.25h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Available Slots</span>
                    <span className="text-purple-400 font-bold">6</span>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}