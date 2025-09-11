import React, { useState } from 'react';
import { Ticket, Plus, Edit, Trash2, Eye, Calendar, Users, DollarSign, Percent, X, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { voucherService } from '../services/voucherService';
import vouchersData from '../data/vouchers.json';
import propertiesData from '../data/properties.json';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { isPropertyLiveForCustomers } from '../utils/propertyCalculations';
import type { Voucher, Property } from '../types';

const VoucherManagement: React.FC = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useLocalStorage('vouchers', vouchersData.vouchers);
  const [voucherUsage] = useLocalStorage('voucherUsage', vouchersData.voucherUsage);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    propertyId: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    expirationDate: '',
    usageLimit: 50
  });

  // Get user's properties that are live for booking
  const userProperties = properties.filter((p: Property) => 
    p.ownerId === user?.id && isPropertyLiveForCustomers(p)
  ) as Property[];

  // Get user's vouchers
  const userVouchers = vouchers.filter((v: Voucher) => v.ownerId === user?.id);

  // Get voucher statistics
  const stats = user ? voucherService.getVoucherStatsForOwner(user.id) : {
    totalVouchers: 0,
    activeVouchers: 0,
    totalUsage: 0,
    totalDiscountGiven: 0
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const property = userProperties.find(p => p.id === formData.propertyId);
      if (!property) {
        throw new Error('Please select a valid property');
      }

      const newVoucher = voucherService.createVoucher({
        code: formData.code.trim() || undefined,
        ownerId: user.id,
        propertyId: formData.propertyId,
        propertyTitle: property.title,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        expirationDate: formData.expirationDate,
        usageLimit: formData.usageLimit
      });

      // Update local state
      setVouchers([...vouchers, newVoucher]);
      
      // Reset form
      setFormData({
        code: '',
        propertyId: '',
        discountType: 'percentage',
        discountValue: 10,
        expirationDate: '',
        usageLimit: 50
      });
      setShowCreateForm(false);
      
      alert(`Voucher "${newVoucher.code}" created successfully!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create voucher');
    }
  };

  const handleUpdateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher) return;

    try {
      const updates = {
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        expirationDate: formData.expirationDate,
        usageLimit: formData.usageLimit,
        isActive: true
      };

      voucherService.updateVoucher(editingVoucher.id, updates);
      
      // Update local state
      const updatedVouchers = vouchers.map((v: Voucher) =>
        v.id === editingVoucher.id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      setVouchers(updatedVouchers);
      
      setEditingVoucher(null);
      alert('Voucher updated successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update voucher');
    }
  };

  const handleDeleteVoucher = (voucherId: string) => {
    if (confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) {
      voucherService.deleteVoucher(voucherId);
      setVouchers(vouchers.filter((v: Voucher) => v.id !== voucherId));
      alert('Voucher deleted successfully');
    }
  };

  const toggleVoucherStatus = (voucherId: string, isActive: boolean) => {
    voucherService.updateVoucher(voucherId, { isActive });
    const updatedVouchers = vouchers.map((v: Voucher) =>
      v.id === voucherId ? { ...v, isActive, updatedAt: new Date().toISOString() } : v
    );
    setVouchers(updatedVouchers);
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getVoucherUsageForVoucher = (voucherId: string) => {
    return voucherUsage.filter((u: any) => u.voucherId === voucherId);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      propertyId: '',
      discountType: 'percentage',
      discountValue: 10,
      expirationDate: '',
      usageLimit: 50
    });
  };

  const startEdit = (voucher: Voucher) => {
    setFormData({
      code: voucher.code,
      propertyId: voucher.propertyId,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      expirationDate: voucher.expirationDate,
      usageLimit: voucher.usageLimit
    });
    setEditingVoucher(voucher);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voucher Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage discount vouchers for your properties
          </p>
        </div>
        
        {userProperties.length > 0 && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Voucher</span>
          </button>
        )}
      </div>

      {/* No Properties Warning */}
      {userProperties.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3">
            <Ticket className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-900">No Properties Available</h3>
              <p className="text-yellow-800 mt-1">
                You need to have approved properties with accepted contracts before creating vouchers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vouchers</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.totalVouchers}</p>
            </div>
            <Ticket className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Vouchers</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeVouchers}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalUsage}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discount Given</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.totalDiscountGiven)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            My Vouchers ({userVouchers.length})
          </h2>
        </div>

        <div className="p-6">
          {userVouchers.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No vouchers created yet</p>
              {userProperties.length > 0 && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Create Your First Voucher
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userVouchers.map((voucher: Voucher) => {
                const usage = getVoucherUsageForVoucher(voucher.id);
                const isExpired = new Date(voucher.expirationDate) < new Date();
                const isAtLimit = voucher.usedCount >= voucher.usageLimit;
                
                return (
                  <div key={voucher.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{voucher.code}</h3>
                          <button
                            onClick={() => copyVoucherCode(voucher.code)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy voucher code"
                          >
                            {copiedCode === voucher.code ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{voucher.propertyTitle}</p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            voucher.isActive && !isExpired && !isAtLimit
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {!voucher.isActive ? 'Inactive' : 
                             isExpired ? 'Expired' : 
                             isAtLimit ? 'Limit Reached' : 'Active'}
                          </span>
                          
                          <span className="flex items-center text-gray-600">
                            {voucher.discountType === 'percentage' ? (
                              <>
                                <Percent className="w-4 h-4 mr-1" />
                                {voucher.discountValue}% off
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-1" />
                                {formatCurrency(voucher.discountValue)} off
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Expires</p>
                        <p className="font-medium text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(voucher.expirationDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Usage</p>
                        <p className="font-medium text-gray-900">
                          {voucher.usedCount} / {voucher.usageLimit}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedVoucher(voucher)}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                      
                      <button
                        onClick={() => startEdit(voucher)}
                        className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => toggleVoucherStatus(voucher.id, !voucher.isActive)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          voucher.isActive
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {voucher.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Voucher Modal */}
      {(showCreateForm || editingVoucher) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingVoucher(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={editingVoucher ? handleUpdateVoucher : handleCreateVoucher} className="space-y-6">
                {!editingVoucher && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property *
                    </label>
                    <select
                      value={formData.propertyId}
                      onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a property</option>
                      {userProperties.map((property: Property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Code {!editingVoucher && '(leave blank to auto-generate)'}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={editingVoucher ? editingVoucher.code : "e.g., WELCOME10 (auto-generated if empty)"}
                    maxLength={20}
                    disabled={!!editingVoucher}
                  />
                  {!editingVoucher && (
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to auto-generate a unique code
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        discountType: e.target.value as 'percentage' | 'fixed',
                        discountValue: e.target.value === 'percentage' ? 10 : 25
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="fixed">Fixed Amount Discount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value *
                    </label>
                    <div className="relative">
                      {formData.discountType === 'fixed' && (
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                      )}
                      <input
                        type="number"
                        min={formData.discountType === 'percentage' ? 1 : 1}
                        max={formData.discountType === 'percentage' ? 50 : 1000}
                        value={formData.discountValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          formData.discountType === 'fixed' ? 'pl-8' : ''
                        }`}
                        required
                      />
                      {formData.discountType === 'percentage' && (
                        <span className="absolute right-3 top-3 text-gray-500">%</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.discountType === 'percentage' 
                        ? 'Percentage off the booking total (1-50%)'
                        : 'Fixed dollar amount off the booking total ($1-$1000)'
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum number of times this voucher can be used
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingVoucher(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Details Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Voucher Details</h3>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Voucher Info */}
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-emerald-900">{selectedVoucher.code}</h4>
                    <button
                      onClick={() => copyVoucherCode(selectedVoucher.code)}
                      className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy Code</span>
                    </button>
                  </div>
                  <p className="text-emerald-800">{selectedVoucher.propertyTitle}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="flex items-center">
                      {selectedVoucher.discountType === 'percentage' ? (
                        <>
                          <Percent className="w-4 h-4 mr-1" />
                          {selectedVoucher.discountValue}% discount
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(selectedVoucher.discountValue)} discount
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Times Used</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedVoucher.usedCount} / {selectedVoucher.usageLimit}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Discount Given</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          getVoucherUsageForVoucher(selectedVoucher.id)
                            .reduce((sum: number, u: any) => sum + u.discountAmount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Voucher Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Voucher Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{formatDate(selectedVoucher.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="text-gray-900">{formatDate(selectedVoucher.expirationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-900">{formatDate(selectedVoucher.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        selectedVoucher.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedVoucher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Usage */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Usage</h4>
                  <div className="space-y-2">
                    {getVoucherUsageForVoucher(selectedVoucher.id).slice(0, 5).map((usage: any) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{usage.customerName}</p>
                          <p className="text-sm text-gray-600">{formatDate(usage.usedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            -{formatCurrency(usage.discountAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {getVoucherUsageForVoucher(selectedVoucher.id).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No usage history yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;