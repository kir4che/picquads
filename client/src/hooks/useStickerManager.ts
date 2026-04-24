import { useReducer, useCallback } from 'react';

import { Sticker } from '../types/sticker';

type StickerState = {
  stickers: Sticker[];
  activeStickerSrc: string | null;
  selectedStickerId: string | null;
};

type StickerAction =
  | { type: 'SET_ACTIVE_SRC'; payload: string | null }
  | { type: 'ADD_STICKER'; payload: Sticker }
  | {
      type: 'UPDATE_STICKER';
      payload: { id: string } & Partial<
        Pick<Sticker, 'x' | 'y' | 'width' | 'height' | 'rotation'>
      >;
    }
  | { type: 'REMOVE_STICKER'; payload: string }
  | { type: 'SELECT_STICKER'; payload: string }
  | { type: 'CLEAR_SELECTION' };

const initialState: StickerState = {
  stickers: [],
  activeStickerSrc: null,
  selectedStickerId: null,
};

const stickerReducer = (
  state: StickerState,
  action: StickerAction
): StickerState => {
  switch (action.type) {
    case 'SET_ACTIVE_SRC':
      return {
        ...state,
        activeStickerSrc: action.payload,
        selectedStickerId: null,
      };
    case 'ADD_STICKER':
      return {
        ...state,
        stickers: [...state.stickers, action.payload],
        activeStickerSrc: null,
      };
    case 'UPDATE_STICKER':
      return {
        ...state,
        stickers: state.stickers.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case 'REMOVE_STICKER':
      return {
        ...state,
        stickers: state.stickers.filter((s) => s.id !== action.payload),
        selectedStickerId:
          state.selectedStickerId === action.payload
            ? null
            : state.selectedStickerId,
      };
    case 'SELECT_STICKER': {
      const sticker = state.stickers.find((s) => s.id === action.payload);
      if (!sticker) return state;
      return {
        ...state,
        stickers: [
          ...state.stickers.filter((s) => s.id !== action.payload),
          sticker,
        ],
        selectedStickerId: action.payload,
        activeStickerSrc: null,
      };
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedStickerId: null };

    default:
      return state;
  }
};

export const useStickerManager = () => {
  const [state, dispatch] = useReducer(stickerReducer, initialState);

  const setActiveSrc = useCallback((src: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SRC', payload: src });
  }, []);

  const addSticker = useCallback((sticker: Sticker) => {
    dispatch({ type: 'ADD_STICKER', payload: sticker });
  }, []);

  const updateSticker = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<Sticker, 'x' | 'y' | 'width' | 'height' | 'rotation'>
      >
    ) => {
      dispatch({ type: 'UPDATE_STICKER', payload: { id, ...updates } });
    },
    []
  );

  const removeSticker = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_STICKER', payload: id });
  }, []);

  const selectSticker = useCallback((id: string) => {
    dispatch({ type: 'SELECT_STICKER', payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  return {
    stickers: state.stickers,
    activeStickerSrc: state.activeStickerSrc,
    selectedStickerId: state.selectedStickerId,
    setActiveSrc,
    addSticker,
    updateSticker,
    removeSticker,
    selectSticker,
    clearSelection,
  };
};
