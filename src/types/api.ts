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

export interface CompanyDto {
  id: string;
  name: string;
  federalRegistration: string;
  createdIn: string;
  isActive: boolean;
  updatedIn: string;
}
