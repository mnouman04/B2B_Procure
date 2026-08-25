import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import {
  userRepository, companyRepository, supplierRepository, categoryRepository,
} from '../repositories/index.js';
import { ROLES, VERIFICATION_STATUS } from '../config/constants.js';
import { coordsForCity } from '../utils/geo.js';
import { runInTransaction, opts } from '../utils/transaction.js';

const issueTokens = (user) => {
  const payload = { sub: String(user._id), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: payload.sub }),
  };
};

class AuthService {
  /** Company Registration — creates the buying organisation and its first user. */
  async registerCompany(dto) {
    if (await userRepository.findByEmail(dto.email)) {
      throw ApiError.conflict('An account with this email already exists');
    }
    if (await companyRepository.findByCr(dto.company.crNumber)) {
      throw ApiError.conflict('This commercial registration number is already registered');
    }

    const user = await runInTransaction(async (session) => {
      const [company] = await companyRepository.model.create(
        [{
          name: dto.company.name,
          nameAr: dto.company.nameAr,
          crNumber: dto.company.crNumber,
          vatNumber: dto.company.vatNumber,
          sector: dto.company.sector,
          size: dto.company.size,
          website: dto.company.website,
          email: dto.email,
          phone: dto.phone,
          address: {
            line1: dto.company.address,
            city: dto.company.city,
            region: dto.company.region,
            country: dto.company.country,
          },
          status: VERIFICATION_STATUS.PENDING,
        }],
        opts(session),
      );

      const [created] = await userRepository.model.create(
        [{
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: dto.password,
          phone: dto.phone,
          jobTitle: dto.jobTitle || 'Procurement Manager',
          role: ROLES.BUYER,
          company: company._id,
        }],
        opts(session),
      );

      company.owner = created._id;
      await company.save(opts(session));
      return created;
    });

    return this.#session(user);
  }

  /** "Join as Supplier" — creates the supplier organisation, pending verification. */
  async registerSupplier(dto) {
    if (await userRepository.findByEmail(dto.email)) {
      throw ApiError.conflict('An account with this email already exists');
    }
    if (await supplierRepository.findByCr(dto.supplier.crNumber)) {
      throw ApiError.conflict('This commercial registration number is already registered');
    }

    const categories = await categoryRepository.find(
      { _id: { $in: dto.supplier.categories } },
      { lean: true },
    );
    if (!categories.length) throw ApiError.badRequest('Select at least one valid category');

    const coords = coordsForCity(dto.supplier.city) || {};

    const user = await runInTransaction(async (session) => {
      const [supplier] = await supplierRepository.model.create(
        [{
          name: dto.supplier.name,
          nameAr: dto.supplier.nameAr,
          crNumber: dto.supplier.crNumber,
          vatNumber: dto.supplier.vatNumber,
          about: dto.supplier.about,
          categories: categories.map((c) => c._id),
          primaryCategory: dto.supplier.primaryCategory || categories[0]._id,
          contact: {
            email: dto.email,
            phone: dto.phone,
            website: dto.supplier.website,
            contactPerson: `${dto.firstName} ${dto.lastName}`,
          },
          location: {
            city: dto.supplier.city,
            region: dto.supplier.region,
            country: dto.supplier.country,
            lat: coords.lat ?? null,
            lng: coords.lng ?? null,
          },
          coverageAreas: dto.supplier.coverageAreas?.length
            ? dto.supplier.coverageAreas
            : [dto.supplier.city],
          foundedYear: dto.supplier.foundedYear ?? null,
          employees: dto.supplier.employees ?? 0,
          status: VERIFICATION_STATUS.PENDING,
          verified: false,
        }],
        opts(session),
      );

      const [created] = await userRepository.model.create(
        [{
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: dto.password,
          phone: dto.phone,
          jobTitle: dto.jobTitle || 'Sales Manager',
          role: ROLES.SUPPLIER,
          supplier: supplier._id,
        }],
        opts(session),
      );

      supplier.owner = created._id;
      await supplier.save(opts(session));
      return created;
    });

    return this.#session(user);
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user) throw ApiError.unauthorized('Incorrect email or password');

    const matches = await user.comparePassword(password);
    if (!matches) throw ApiError.unauthorized('Incorrect email or password');
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return this.#session(user);
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('Refresh token missing');
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account unavailable');
    return this.#session(user);
  }

  async me(userId) {
    const user = await userRepository.findWithOrg(userId);
    if (!user) throw ApiError.notFound('User');
    return user;
  }

  async updateProfile(userId, dto) {
    const user = await userRepository.updateById(userId, dto);
    if (!user) throw ApiError.notFound('User');
    return userRepository.findWithOrg(userId);
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.model.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User');
    const matches = await user.comparePassword(currentPassword);
    if (!matches) throw ApiError.badRequest('Your current password is incorrect');
    user.password = newPassword;
    await user.save();
    return { updated: true };
  }

  async #session(user) {
    const hydrated = await userRepository.findWithOrg(user._id);
    return { user: hydrated, ...issueTokens(hydrated) };
  }
}

export const authService = new AuthService();
