import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/index.jsx';
import { selectUser, updateProfile } from '../../store/authSlice.js';
import { useMutation } from '../../hooks/useApi.js';
import { authApi } from '../../api/endpoints.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar, PageHeader } from '../../components/ui/Misc.jsx';
import { toFieldErrors } from '../../utils/format.js';

/** Account settings — profile fields, interface language and password. */
export const SettingsPage = () => {
  const { t, locale, setLocale } = useI18n();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    jobTitle: user?.jobTitle ?? '',
    locale: user?.locale ?? locale,
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});

  const changePassword = useMutation((payload) => authApi.changePassword(payload));

  const saveProfile = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProfile(profile));
    if (updateProfile.fulfilled.match(result)) {
      setLocale(profile.locale);
      toast.success(t('common.save'));
    } else {
      toast.error(result.payload?.message ?? t('common.error'));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await changePassword.mutate(passwords);
      toast.success(res.message);
      setPasswords({ currentPassword: '', newPassword: '' });
      setErrors({});
    } catch (err) {
      setErrors(toFieldErrors(err));
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title={t('sidebar.settings')} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('common.profile')} />
          <form onSubmit={saveProfile} className="border-t border-line p-5">
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={user?.fullName} size={56} rounded="full" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{user?.fullName}</p>
                <p className="truncate text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.firstName')}
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
              <Input
                label={t('auth.lastName')}
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
              <Input
                label={t('auth.phone')}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              <Input
                label={t('auth.jobTitle')}
                value={profile.jobTitle}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              />
              <Select
                className="sm:col-span-2"
                label={t('common.language')}
                value={profile.locale}
                onChange={(e) => setProfile({ ...profile, locale: e.target.value })}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Select>
            </div>

            <Button type="submit" icon={Save} className="mt-5">
              {t('common.save')}
            </Button>
          </form>
        </Card>

        <Card className="self-start">
          <CardHeader title={t('auth.password')} />
          <form onSubmit={savePassword} className="space-y-4 border-t border-line p-5">
            <Input
              label={t('auth.password')}
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              error={errors.currentPassword}
            />
            <Input
              label={`${t('auth.password')} (new)`}
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              error={errors.newPassword}
              hint="At least 8 characters, including a letter and a number"
            />
            <Button type="submit" icon={Lock} variant="soft" loading={changePassword.loading}>
              {t('common.save')}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
};
