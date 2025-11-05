import React, { useState, useEffect, FormEvent } from 'react';
import { Agendamento, Client, UserInfo, SavedPDF } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SearchableSelect from '../ui/SearchableSelect';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Definindo SchedulingInfo localmente, pois estava sendo importado de App.tsx
export type SchedulingInfo = {
    pdf: SavedPDF;
    agendamento?: Agendamento;
} | {
    agendamento: Agendamento;
    pdf?: SavedPDF;
} | {
    pdf?: SavedPDF;
    agendamento?: Agendamento;
    start?: Date; // Adicionado para novo agendamento sem PDF
};

type AISuggestion = {
    nome: string;
    telefone: string;
    data: string; // Data/Hora sugerida
}