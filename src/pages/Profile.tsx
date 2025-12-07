import Icon from '@/components/ui/icon';
import DashboardLayout from '@/layouts/DashboardLayout';
import AvatarSection from '@/components/profile/AvatarSection';
import PersonalDataSection from '@/components/profile/PersonalDataSection';
import EmailSection from '@/components/profile/EmailSection';
import SecuritySection from '@/components/profile/SecuritySection';
import LogoutSection from '@/components/profile/LogoutSection';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileActions } from '@/hooks/useProfileActions';

export default function Profile() {
  const {
    profile,
    loading,
    setLoading,
    editMode,
    setEditMode,
    passwordDialogOpen,
    setPasswordDialogOpen,
    emailDialogOpen,
    setEmailDialogOpen,
    emailCodeSent,
    setEmailCodeSent,
    formData,
    setFormData,
    passwordData,
    setPasswordData,
    emailData,
    setEmailData,
    loadProfile,
    toast
  } = useProfileData();

  const {
    handleUpdateProfile,
    handleChangePassword,
    handleRequestEmailChange,
    handleConfirmEmailChange,
    handleAvatarUpload,
    handleDeleteAvatar
  } = useProfileActions({
    setLoading,
    setEditMode,
    setPasswordDialogOpen,
    setEmailDialogOpen,
    setEmailCodeSent,
    setPasswordData,
    setEmailData,
    loadProfile,
    toast,
    formData,
    passwordData,
    emailData
  });

  if (loading && !profile) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-16">
          <Icon name="Loader2" className="animate-spin" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Профиль</h2>
          <p className="text-muted-foreground mt-1">Управление данными пользователя</p>
        </div>

        <AvatarSection
          profile={profile}
          loading={loading}
          onUpload={handleAvatarUpload}
          onDelete={handleDeleteAvatar}
        />

        <PersonalDataSection
          profile={profile}
          formData={formData}
          editMode={editMode}
          loading={loading}
          onFormChange={(data) => setFormData({ ...formData, ...data })}
          onEdit={() => setEditMode(true)}
          onSave={handleUpdateProfile}
          onCancel={() => {
            setEditMode(false);
            setFormData({
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              middle_name: profile?.middle_name || '',
              phone: profile?.phone || ''
            });
          }}
        />

        <EmailSection
          profile={profile}
          emailData={emailData}
          emailDialogOpen={emailDialogOpen}
          emailCodeSent={emailCodeSent}
          loading={loading}
          onEmailChange={(data) => setEmailData({ ...emailData, ...data })}
          onOpenDialog={() => setEmailDialogOpen(true)}
          onCloseDialog={() => {
            setEmailDialogOpen(false);
            setEmailCodeSent(false);
            setEmailData({ new_email: '', code: '' });
          }}
          onRequestChange={handleRequestEmailChange}
          onConfirmChange={handleConfirmEmailChange}
        />

        <SecuritySection
          passwordData={passwordData}
          passwordDialogOpen={passwordDialogOpen}
          loading={loading}
          onPasswordChange={(data) => setPasswordData({ ...passwordData, ...data })}
          onOpenDialog={() => setPasswordDialogOpen(true)}
          onCloseDialog={() => {
            setPasswordDialogOpen(false);
            setPasswordData({ new_password: '', confirm_password: '' });
          }}
          onChangePassword={handleChangePassword}
        />

        <LogoutSection />
      </div>
    </DashboardLayout>
  );
}
