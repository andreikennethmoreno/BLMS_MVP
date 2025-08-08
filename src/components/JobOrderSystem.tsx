import React, { useState } from 'react';
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import jobOrdersData from '../data/jobOrders.json';
import concernsData from '../data/concerns.json';
import propertiesData from '../data/properties.json';

interface JobOrder {
  id: string;
  concernId: string;
  propertyId: string;
  ownerId: string;
  title: string;
  description: string;
  assignedTeam: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion: string;
  notes: string;
  createdBy: string;
}

const JobOrderSystem: React.FC = () => {
  const { user } = useAuth();
  const [jobOrders, setJobOrders] = useLocalStorage('jobOrders', jobOrdersData.jobOrders);
  const [concerns] = useLocalStorage('concerns', concernsData.concerns);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [selectedConcernId, setSelectedConcernId] = useState('');
  const [newJobOrder, setNewJobOrder] = useState({
    title: '',
    description: '',
    assignedTeam: '',
    priority: 'medium',
    estimatedCompletion: '',
    notes: ''
  });

  // Get job orders based on user role
  const getUserJobOrders = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'property_manager':
        return jobOrders;
      case 'unit_owner':
        return jobOrders.filter((job: JobOrder) => job.ownerId === user.id);
      default:
        return [];
    }
  };

  // Get unresolved concerns that can have job orders created
  const getAvailableConcerns = () => {
    return concerns.filter((concern: any) => 
      concern.status !== 'resolved' && 
      !jobOrders.some((job: JobOrder) => job.concernId === concern.id)
    );
  };

  const handleSubmitJobOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConcernId) return;

    const concern = concerns.find((c: any) => c.id === selectedConcernId);
    if (!concern) return;

    const jobOrder: JobOrder = {
      id: `job-${Date.now()}`,
      concernId: selectedConcernId,
      propertyId: concern.propertyId,
      ownerId: concern.ownerId,
      title: newJobOrder.title,
      description: newJobOrder.description,
      assignedTeam: newJobOrder.assignedTeam,
      status: 'pending',
      priority: newJobOrder.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: newJobOrder.estimatedCompletion,
      notes: newJobOrder.notes,
      createdBy: user.id
    };

    setJobOrders([...jobOrders, jobOrder]);
    setShowNewJobForm(false);
    setSelectedConcernId('');
    setNewJobOrder({
      title: '',
      description: '',
      assignedTeam: '',
      priority: 'medium',
      estimatedCompletion: '',
      notes: ''
    });
  };

  const updateJobOrderStatus = (jobId: string, status: string) => {
    const updatedJobOrders = jobOrders.map((job: JobOrder) =>
      job.id === jobId 
        ? { ...job, status, updatedAt: new Date().toISOString() }
        : job
    );
    setJobOrders(updatedJobOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const userJobOrders = getUserJobOrders();
  const availableConcerns = getAvailableConcerns();

  const stats = {
    total: userJobOrders.length,
    pending: userJobOrders.filter((job: JobOrder) => job.status === 'pending').length,
    inProgress: userJobOrders.filter((job: JobOrder) => job.status === 'in_progress').length,
    completed: userJobOrders.filter((job: JobOrder) => job.status === 'completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Orders</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'property_manager' 
              ? 'Create and manage maintenance job orders'
              : 'View job orders for your properties'
            }
          </p>
        </div>
        
        {user?.role === 'property_manager' && availableConcerns.length > 0 && (
          <button
            onClick={() => setShowNewJobForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Job Order</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Job Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Job Orders ({userJobOrders.length})
          </h2>
        </div>

        <div className="p-6">
          {userJobOrders.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No job orders yet</p>
              {user?.role === 'property_manager' && (
                <p className="text-sm text-gray-400 mt-2">
                  Job orders are created from unresolved concerns
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {userJobOrders.map((jobOrder: JobOrder) => {
                const property = properties.find((p: any) => p.id === jobOrder.propertyId);
                const concern = concerns.find((c: any) => c.id === jobOrder.concernId);
                
                return (
                  <div key={jobOrder.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{jobOrder.title}</h3>
                        <p className="text-gray-600 mb-2">{property?.title}</p>
                        <p className="text-gray-700 mb-3">{jobOrder.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Assigned Team</p>
                            <p className="font-medium text-gray-900">{jobOrder.assignedTeam}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium text-gray-900">
                              {new Date(jobOrder.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Est. Completion</p>
                            <p className="font-medium text-gray-900">
                              {new Date(jobOrder.estimatedCompletion).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="font-medium text-gray-900">
                              {new Date(jobOrder.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(jobOrder.status)}`}>
                            {jobOrder.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(jobOrder.priority)}`}>
                            {jobOrder.priority} priority
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {user?.role === 'property_manager' && (
                          <select
                            value={jobOrder.status}
                            onChange={(e) => updateJobOrderStatus(jobOrder.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                        <button
                          onClick={() => setSelectedJobOrder(jobOrder)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Job Order Form Modal */}
      {showNewJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Create Job Order</h3>
                <button
                  onClick={() => setShowNewJobForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitJobOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Concern
                  </label>
                  <select
                    value={selectedConcernId}
                    onChange={(e) => setSelectedConcernId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a concern...</option>
                    {availableConcerns.map((concern: any) => {
                      const property = properties.find((p: any) => p.id === concern.propertyId);
                      return (
                        <option key={concern.id} value={concern.id}>
                          {concern.title} - {property?.title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={newJobOrder.title}
                    onChange={(e) => setNewJobOrder(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief title for the job"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={newJobOrder.description}
                    onChange={(e) => setNewJobOrder(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Detailed description of work to be done"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Team
                    </label>
                    <input
                      type="text"
                      value={newJobOrder.assignedTeam}
                      onChange={(e) => setNewJobOrder(prev => ({ ...prev, assignedTeam: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Team or contractor name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newJobOrder.priority}
                      onChange={(e) => setNewJobOrder(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newJobOrder.estimatedCompletion}
                    onChange={(e) => setNewJobOrder(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={newJobOrder.notes}
                    onChange={(e) => setNewJobOrder(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Any additional notes or instructions"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowNewJobForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create Job Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Job Order Details Modal */}
      {selectedJobOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">{selectedJobOrder.title}</h3>
                <button
                  onClick={() => setSelectedJobOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Property</h4>
                  <p className="text-gray-600">
                    {properties.find((p: any) => p.id === selectedJobOrder.propertyId)?.title}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedJobOrder.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assigned Team</h4>
                    <p className="text-gray-700">{selectedJobOrder.assignedTeam}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedJobOrder.priority)}`}>
                      {selectedJobOrder.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedJobOrder.status)}`}>
                      {selectedJobOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Est. Completion</h4>
                    <p className="text-gray-700">
                      {new Date(selectedJobOrder.estimatedCompletion).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedJobOrder.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700">{selectedJobOrder.notes}</p>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>Created: {new Date(selectedJobOrder.createdAt).toLocaleString()}</p>
                  <p>Last Updated: {new Date(selectedJobOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobOrderSystem;