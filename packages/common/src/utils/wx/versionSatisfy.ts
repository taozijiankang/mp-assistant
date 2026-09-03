import { WXVersionBasicInfo } from "../../types/wx.js";

export enum VersionPositioningType {
    /** 描述 */
    Describe = 'describe',
    /** 开发者 */
    NickName = 'nick_name',
    /** 版本 */
    Version = 'version',
}

export const VersionPositioningTypeDict = {
    [VersionPositioningType.Describe]: '备注',
    [VersionPositioningType.NickName]: '发布者',
    [VersionPositioningType.Version]: '版本号',
}

export const VersionPositioningTypeOptions = Object.values(VersionPositioningType).map(type => ({
    label: VersionPositioningTypeDict[type],
    value: type,
}));

export enum VersionPositioningCriteria {
    /** 相等 */
    Equal = 'Equal',
    /** 包含 */
    Inclusion = 'Inclusion',
}

export const VersionPositioningCriteriaDict = {
    [VersionPositioningCriteria.Equal]: '等于',
    [VersionPositioningCriteria.Inclusion]: '包含'
}

export const VersionPositioningCriteriaOptions = Object.values(VersionPositioningCriteria).map(type => ({
    label: VersionPositioningCriteriaDict[type],
    value: type,
}));

export interface VersionPositioner {
    type: VersionPositioningType;
    criteria: VersionPositioningCriteria;
    value: string;
}

/**
 * 版本是否满足条件
 * @param version 
 * @param positioners 
 */
export function versionSatisfy(version: WXVersionBasicInfo, positioners: VersionPositioner[]) {
    if (!positioners.length) return false;
    return positioners.every(item => {
        const value = item.value.trim();
        switch (item.type) {
            case VersionPositioningType.Describe:
                return {
                    [VersionPositioningCriteria.Equal]: version.describe === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.describe?.includes(value) : false,
                }[item.criteria]
            case VersionPositioningType.NickName:
                return {
                    [VersionPositioningCriteria.Equal]: version.nick_name === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.nick_name?.includes(value) : false,
                }[item.criteria]
            case VersionPositioningType.Version:
                return {
                    [VersionPositioningCriteria.Equal]: version.version === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.version?.includes(value) : false,
                }[item.criteria]
            default:
                return false;
        }
    });
}