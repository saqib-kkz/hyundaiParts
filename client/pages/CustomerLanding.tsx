import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Upload, Car, Shield, Clock, Users, AlertCircle, Star, Award, PhoneCall } from "lucide-react";
import { SparePartFormData } from "@shared/types";
import { sparePartFormSchema, validateImageFile } from "@/lib/validation";
import { DatabaseService } from "@/lib/database";

export default function CustomerLanding() {
  const [formData, setFormData] = useState<SparePartFormData>({
    customer_name: "",
    phone_number: "",
    email: "",
    vehicle_estamra: "",
    vin_number: "",
    part_name: "",
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (field: keyof SparePartFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setErrors(prev => ({ ...prev, part_photo: "" }));
      } else {
        setErrors(prev => ({ ...prev, part_photo: validation.error! }));
        e.target.value = "";
      }
    }
  };

  const validateForm = (): boolean => {
    const result = sparePartFormSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path.length > 0) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await DatabaseService.submitRequest(formData, selectedFile || undefined);
      
      if (result.success && result.requestId) {
        setSubmittedRequestId(result.requestId);
        setIsSubmitted(true);
      } else {
        setSubmitError(result.error || "Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Request Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-2">
              Request ID: <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{submittedRequestId}</span>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium">
                🎯 Our team will check availability and contact you within 24 hours with pricing and payment details.
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  customer_name: "",
                  phone_number: "",
                  email: "",
                  vehicle_estamra: "",
                  vin_number: "",
                  part_name: "",
                });
                setSelectedFile(null);
                setSubmittedRequestId("");
                setErrors({});
                setSubmitError("");
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Reduced Hero Section with Hyundai Elantra Background */}
      <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        {/* Hyundai Elantra Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1606016006107-d6b3f0c35d8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80')"
          }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with Logos */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* Hyundai Logo */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/20">
                <img 
                  src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F89209ad27c684dbc9b90f452ff107a5b?format=webp&width=800"
                  alt="Hyundai"
                  className="h-8 lg:h-10 w-auto"
                />
              </div>
              
              {/* Partnership Indicator */}
              <div className="text-xl lg:text-2xl font-light opacity-70">×</div>
              
              {/* Wallan Group Logo */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/20">
                <img 
                  src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F6bea580910924f218a7dc8e31190ff81?format=webp&width=800"
                  alt="Wallan Group"
                  className="h-8 lg:h-10 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Hero Content - Streamlined */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Hyundai Spare Parts
              <span className="block text-blue-200 text-3xl lg:text-4xl">Request System</span>
            </h1>
            <p className="text-xl text-blue-100 mb-6 leading-relaxed max-w-2xl mx-auto">
              Get genuine Hyundai spare parts delivered quickly. Submit your request below for competitive pricing.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Shield className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100 font-medium">Genuine Parts</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Clock className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100 font-medium">24hr Response</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Award className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100 font-medium">Authorized Dealer</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="animate-bounce">
              <div className="w-8 h-8 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto">
                <div className="w-1 h-3 bg-blue-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Immediately Visible Form Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Request Your Spare Part
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fill out the form below with your vehicle and part details. Our team will verify availability and provide you with pricing and payment options.
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300">
            <CardContent className="p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Customer Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-3 border-b-2 border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Customer Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label htmlFor="customer_name" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                        Full Name *
                      </Label>
                      <Input
                        id="customer_name"
                        type="text"
                        required
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange("customer_name", e.target.value)}
                        placeholder="Enter your full name"
                        className={`h-12 border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.customer_name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                      />
                      {errors.customer_name && (
                        <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                          <AlertCircle className="h-3 w-3" />
                          {errors.customer_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2 group">
                      <Label htmlFor="phone_number" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        required
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange("phone_number", e.target.value)}
                        placeholder="Enter your phone number"
                        className={`h-12 border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.phone_number ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                      />
                      {errors.phone_number && (
                        <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                          <AlertCircle className="h-3 w-3" />
                          {errors.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                      className={`h-12 border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-3 border-b-2 border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Vehicle Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label htmlFor="vehicle_estamra" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                        Vehicle Estamra Number *
                      </Label>
                      <Input
                        id="vehicle_estamra"
                        type="text"
                        required
                        value={formData.vehicle_estamra}
                        onChange={(e) => handleInputChange("vehicle_estamra", e.target.value.toUpperCase())}
                        placeholder="Registration number"
                        className={`h-12 border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.vehicle_estamra ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                      />
                      {errors.vehicle_estamra && (
                        <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                          <AlertCircle className="h-3 w-3" />
                          {errors.vehicle_estamra}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2 group">
                      <Label htmlFor="vin_number" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                        VIN Number *
                      </Label>
                      <Input
                        id="vin_number"
                        type="text"
                        required
                        value={formData.vin_number}
                        onChange={(e) => handleInputChange("vin_number", e.target.value.toUpperCase())}
                        placeholder="17-character VIN"
                        maxLength={17}
                        className={`h-12 border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.vin_number ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                      />
                      {errors.vin_number && (
                        <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                          <AlertCircle className="h-3 w-3" />
                          {errors.vin_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Part Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-3 border-b-2 border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Part Information</h3>
                  </div>
                  
                  <div className="space-y-2 group">
                    <Label htmlFor="part_name" className="text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
                      Part Name / Description *
                    </Label>
                    <Textarea
                      id="part_name"
                      required
                      value={formData.part_name}
                      onChange={(e) => handleInputChange("part_name", e.target.value)}
                      placeholder="Describe the part you need (e.g., Front brake pads, Side mirror assembly, etc.)"
                      rows={4}
                      className={`border-2 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${errors.part_name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200"}`}
                    />
                    {errors.part_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.part_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="part_photo" className="text-sm font-semibold text-gray-700">
                      Part Photo (Optional)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
                      <input
                        id="part_photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="part_photo"
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-lg">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {selectedFile ? selectedFile.name : "Click to upload a photo of the part"}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                        </div>
                      </label>
                      {errors.part_photo && (
                        <p className="text-sm text-red-500 mt-2 flex items-center justify-center gap-1 animate-in slide-in-from-left-2">
                          <AlertCircle className="h-3 w-3" />
                          {errors.part_photo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* Important Notice */}
                <Alert className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    <strong>Important:</strong> Please ensure all information is accurate. 
                    Our team will verify your vehicle details and contact you within 24 hours 
                    with availability and pricing information.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Request...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Submit Request</span>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Our Spare Parts Service?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the reliability and quality that comes with authorized Hyundai parts and professional service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Genuine Parts Only</h4>
              <p className="text-gray-600">All parts are authentic Hyundai components with full warranty coverage.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast Response</h4>
              <p className="text-gray-600">Get availability confirmation and pricing within 24 hours.</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Expert Support</h4>
              <p className="text-gray-600">Professional assistance from certified Hyundai technicians.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean White Footer */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4">
            {/* Logos */}
            <div className="flex items-center space-x-4">
              <img 
                src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F89209ad27c684dbc9b90f452ff107a5b?format=webp&width=800"
                alt="Hyundai"
                className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity"
              />
              <span className="text-gray-400">×</span>
              <img 
                src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F6bea580910924f218a7dc8e31190ff81?format=webp&width=800"
                alt="Wallan Group"
                className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-500 text-center">
              © 2024 Hyundai Saudi Arabia × Wallan Group. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
