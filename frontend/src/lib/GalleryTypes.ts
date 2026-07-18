export interface GalleryItem {
  id: string;
  ext: string;
  displayname: string;
  type: "image" | "video";
  createdAt: number;
}

export interface Store {
  settings: {
    activeGalleryItemId: string | null;
    offsetBottom: number | null;
    offsetTop: number | null;
  };
  gallery: GalleryItem[];
}
