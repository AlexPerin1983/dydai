import React, { useState, useEffect, FormEvent } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userInfo: UserInfo) => void;
    userInfo: UserInfo;
    onOpenPaymentMethods: () => void;
}

const applyPhoneMask = (value: string) => {
    if (!value) return "";
    let digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 11) {
      digitsOnly = digitsOnly.slice(0, 11);
    }
    if (digitsOnly.length > 10) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
    }
    if (digitsOnly.length > 6) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    }
    if (digitsOnly.length > 2) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    }
    if (digitsOnly.length > 0) {
      return `(${digitsOnly}`;
    }
    return "";
};

const applyCpfCnpjMask = (value: string) => {
    if (!value) return "";
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length <= 11) {
        return digitsOnly.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    } else {
        return digitsOnly.slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})/, '$1-$2');
    }
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userInfo, onOpenPaymentMethods }) => {
    const [formData, setFormData] = useState<UserInfo>(userInfo);
    const [logoPreview, setLogoPreview] = useState<string | undefined>(userInfo.logo);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...userInfo,
                cpfCnpj: applyCpfCnpjMask(userInfo.cpfCnpj || '') // Aplica máscara ao carregar
            }));
            setLogoPreview(userInfo.logo);
        }
    }, [userInfo, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        if (id === 'telefone') {
            setFormData(prev => ({ ...prev, [id]: applyPhoneMask(value) }));
        } else if (id === 'cpfCnpj') {
            setFormData(prev => ({ ...prev, [id]: applyCpfCnpjMask(value) })); // Aplica máscara
        }
        else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };
    
// ... (rest of the component)
// ...
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input id="cpfCnpj" label="CPF/CNPJ" type="text" value={formData.cpfCnpj} onChange={handleChange} required inputMode="numeric" />
                    <Input id="site" label="Site" type="text" value={formData.site || ''} onChange={handleChange} placeholder="www.suaempresa.com.br" />
                </div>
            </form>
        </Modal>
    );
};

export default UserModal;