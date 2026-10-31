import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Mail,
  Phone,
  Building2,
  AtSign,
  Moon,
  Sun,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Briefcase,
  Star,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import authService from '../services/authService';

/* ─── Avatar Initials Helper ───────────────────────────────────────────────── */
const getInitials = (user) => {
  if (user?.first_name && user?.last_name)
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  if (user?.first_name) return user.first_name[0].toUpperCase();
  if (user?.username) return user.username[0].toUpperCase();
  return 'A';
};

/* ─── Section Card ──────────────────────────────────────────────────────────── */
const SectionCard = ({ title, icon: Icon, children, className = '' }) => (
  <div
    className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden ${className}`}
  >
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">
        {title}
      </h3>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

/* ─── Info Row ──────────────────────────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm text-gray-800 dark:text-gray-100 truncate ${mono ? 'font-mono' : 'font-medium'}`}
      >
        {value || <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>}
      </p>
    </div>
  </div>
);

/* ─── Toggle Switch ─────────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3.5">
    <div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      {description && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
        checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 shadow-sm ${
          checked
            ? 'translate-x-6 bg-white dark:bg-gray-900'
            : 'translate-x-1 bg-white dark:bg-gray-400'
        }`}
      />
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════════════════════════ */
export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  /* Edit mode state */
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  /* Editable fields */
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    role: user?.role || '',
    bio: user?.bio || '',
  });

  /* Notification preferences */
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const handleFieldChange = (field, val) =>
    setFormData((prev) => ({ ...prev, [field]: val }));

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const updated = await authService.updateProfile(formData);
      updateUser({ ...user, ...updated });
      setSaveMsg('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      organization: user?.organization || '',
      role: user?.role || '',
      bio: user?.bio || '',
    });
    setSaveError('');
    setEditing(false);
  };

  const joinDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            My Profile
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your account details, appearance and preferences.
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* ─── Save / Error Toast ───────────────────────────────────────────── */}
      {saveMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {saveMsg}
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* ─── Avatar + Identity Card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Top colour stripe */}
        <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-full bg-gray-900 dark:bg-white border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-md">
              <span className="text-2xl font-black text-white dark:text-gray-900">
                {getInitials(user)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-12 pb-6 px-6">
          {!editing ? (
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username || 'Researcher'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                @{user?.username}
              </p>
              {user?.bio && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 leading-relaxed max-w-lg">
                  {user.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {user?.role && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Star className="w-3 h-3" />
                    {user.role}
                  </span>
                )}
                {user?.organization && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Building2 className="w-3 h-3" />
                    {user.organization}
                  </span>
                )}
                {joinDate && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Calendar className="w-3 h-3" />
                    Joined {joinDate}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* ── Edit Form ─── */
            <div className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="Marie"
                  value={formData.first_name}
                  onChange={(e) => handleFieldChange('first_name', e.target.value)}
                  leftIcon={<User className="w-4 h-4 text-gray-400" />}
                />
                <Input
                  label="Last Name"
                  placeholder="Curie"
                  value={formData.last_name}
                  onChange={(e) => handleFieldChange('last_name', e.target.value)}
                />
              </div>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Institution / Organisation"
                  placeholder="CERN / IIT Delhi"
                  value={formData.organization}
                  onChange={(e) => handleFieldChange('organization', e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4 text-gray-400" />}
                />
                <Input
                  label="Role"
                  placeholder="Senior Researcher"
                  value={formData.role}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                  leftIcon={<Briefcase className="w-4 h-4 text-gray-400" />}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your research interests…"
                  value={formData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Contact & Account Info ───────────────────────────────────────── */}
      <SectionCard title="Account Details" icon={ShieldCheck}>
        <InfoRow icon={Mail} label="Email / Gmail" value={user?.email} mono />
        <InfoRow icon={AtSign} label="Username" value={`@${user?.username}`} mono />
        <InfoRow
          icon={Phone}
          label="Phone Number"
          value={editing ? formData.phone || null : user?.phone || null}
        />
        <InfoRow icon={Building2} label="Institution" value={user?.organization} />
        <InfoRow icon={Briefcase} label="Role" value={user?.role} />
        {joinDate && <InfoRow icon={Calendar} label="Member Since" value={joinDate} />}
      </SectionCard>

      {/* ─── Appearance & Theme ───────────────────────────────────────────── */}
      <SectionCard title="Appearance" icon={darkMode ? Moon : Sun}>
        <Toggle
          checked={darkMode}
          onChange={toggleDarkMode}
          label="Dark Mode / Night Mode"
          description={
            darkMode
              ? 'Dark theme is active — easier on the eyes at night.'
              : 'Light theme active — switch for night reading.'
          }
        />
        <div className="mt-1 flex items-center gap-3">
          {/* Theme preview pills */}
          <button
            onClick={() => darkMode && toggleDarkMode()}
            className={`flex-1 py-5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
              !darkMode
                ? 'border-gray-900 bg-gray-50 text-gray-800'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
            Light
          </button>
          <button
            onClick={() => !darkMode && toggleDarkMode()}
            className={`flex-1 py-5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
              darkMode
                ? 'border-white bg-gray-900 text-white'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-1.5 text-indigo-400" />
            Dark / Night
          </button>
        </div>
      </SectionCard>

      {/* ─── Preferences ─────────────────────────────────────────────────── */}
      <SectionCard title="Preferences" icon={Lock}>
        <Toggle
          checked={emailNotifs}
          onChange={() => setEmailNotifs((p) => !p)}
          label="Email Notifications"
          description="Receive research gap alerts and weekly digests."
        />
        <Toggle
          checked={compactView}
          onChange={() => setCompactView((p) => !p)}
          label="Compact View"
          description="Show denser layout for evidence tables and findings lists."
        />
      </SectionCard>

      {/* ─── Danger Zone ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-50 dark:border-rose-900/40 flex items-center gap-2.5">
          <LogOut className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            Session
          </h3>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sign out</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Ends your current session on this device.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
