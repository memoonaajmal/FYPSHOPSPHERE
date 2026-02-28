"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Box, Typography, Card, CardContent, CardActionArea, Chip } from "@mui/material";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ProductCard({ product }) {
  const router = useRouter();

  if (!product) return null;
  const id = product.productId || product._id;
  if (!id) return null;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(`/user/products/${id}`)}
        sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%" }}
      >
        {/* Image — objectFit: contain so product is never cropped */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            bgcolor: "grey.50",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Image
            src={imageSrc}
            alt={product.productDisplayName || "Product"}
            fill
            style={{ objectFit: "contain", padding: "12px" }}
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
          />
        </Box>

        {/* Info */}
        <CardContent
          sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 1 }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              lineHeight: 1.4,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.productDisplayName}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: "auto" }}>
            {product.baseColour && (
              <Chip
                label={product.baseColour}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: 22,
                  bgcolor: "primary.50",
                  color: "primary.main",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: "primary.200",
                }}
              />
            )}
            {product.articleType && (
              <Chip
                label={product.articleType}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.7rem",
                  height: 22,
                  color: "text.secondary",
                  borderColor: "divider",
                }}
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}