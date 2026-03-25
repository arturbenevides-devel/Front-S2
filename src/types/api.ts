export interface AuthorizedMenuDto {
  id: string;
  action: string;
  deviceType: string;
  displayOrder: number;
  icon: string;
  name: string;
  sectionName?: string;
  tooltip?: string;
  type: string;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canFind: boolean;
    canFindAll: boolean;
  } | null;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password?: string;
  profileId: string;
  companyId?: string;
  profileImage?: string;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  profileId?: string;
  companyId?: string;
  profileImage?: string;
}

export interface UserListItemDto {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  companyId?: string;
  createdIn: string;
  isActive: boolean;
  updatedIn: string;
  profile: {
    id: string;
    name: string;
    description: string;
    createdIn: string;
    isActive: boolean;
    updatedIn: string | null;
    isDefault: boolean;
  };
}

export interface ProfileListItemDto {
  id: string;
  name: string;
  description: string;
  createdIn: string;
  isActive: boolean;
  updatedIn: string;
  isDefault: boolean;
}

/** Permissão por menu dentro de um perfil (POST /profiles e PUT /profiles/:id). */
export interface ProfilePermissionRequest {
  menuId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canFind: boolean;
  canFindAll: boolean;
}

/** Corpo de POST /profiles (CreateProfileDto no back-S2). */
export interface CreateProfileRequest {
  name: string;
  description: string;
  permissions?: ProfilePermissionRequest[];
}

/** Corpo de PUT /profiles/:id (UpdateProfileDto no back-S2). */
export interface UpdateProfileRequest {
  name?: string;
  description?: string;
  permissions?: ProfilePermissionRequest[];
}

/** Permissão de uma entrada do menuResponses dentro de ProfileDetailDto. */
export interface ProfileMenuPermissionItem {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canFind: boolean;
  canFindAll: boolean;
}

/** Um menu dentro de GET /profiles/:id → menuResponses. */
export interface ProfileMenuResponseItem {
  id: string;
  name: string;
  type: string;
  action?: string;
  deviceType?: string;
  displayOrder?: number;
  icon?: string;
  sectionName?: string;
  tooltip?: string;
  permissions: ProfileMenuPermissionItem[];
}

/** Resposta completa de GET /profiles/:id (inclui matriz de permissões). */
export interface ProfileDetailDto extends ProfileListItemDto {
  menuResponses?: ProfileMenuResponseItem[];
}

export interface CompanyDto {
  id: string;
  name: string;
  federalRegistration: string;
  createdIn: string;
  isActive: boolean;
  updatedIn: string;
}
