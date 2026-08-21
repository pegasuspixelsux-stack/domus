import { describe, expect, it } from "vitest";
import { parsePropertiesCsv } from "./csv-import";

const HEADER =
  "Título,Ubicación,Tipo,Precio (USD),Dormitorios,Baños,Metros Cuadrados,Características,Descripción";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("parsePropertiesCsv", () => {
  it("parses a valid row into a PropertyInput with the right defaults", () => {
    const result = parsePropertiesCsv(
      csv(
        'Apartamento en Playa Mansa,"Parada 3, Mansa",Apartamento,450000,3,2,120,"Vista al mar, Garaje",Exclusivo apartamento frente a la playa.',
      ),
    );

    expect(result.invalid).toEqual([]);
    expect(result.valid).toHaveLength(1);
    const { row, data } = result.valid[0];
    expect(row).toBe(2);
    expect(data.title).toBe("Apartamento en Playa Mansa");
    expect(data.location).toBe("Parada 3, Mansa");
    expect(data.tag).toBe("Apartamento");
    expect(data.price).toBe(450000);
    expect(data.bedrooms).toBe(3);
    expect(data.bathrooms).toBe(2);
    expect(data.areaM2).toBe(120);
    expect(data.description).toBe("Exclusivo apartamento frente a la playa.");
    expect(data.currency).toBe("USD");
    expect(data.status).toBe("available");
    expect(data.images).toEqual([]);
  });

  it("splits the Características field into a trimmed features array", () => {
    const result = parsePropertiesCsv(
      csv(
        'Casa en La Barra,La Barra,Casa,1200000,4,3,250,"Jardín, Piscina,  Parrillero techado",Casa amplia.',
      ),
    );

    expect(result.valid[0].data.features).toEqual(["Jardín", "Piscina", "Parrillero techado"]);
  });

  it("reports a row missing a required field without blocking the other rows", () => {
    const result = parsePropertiesCsv(
      csv(
        ",Ubicación X,Casa,500000,3,2,100,Jardín,Descripción X",
        "Casa Válida,Ubicación Y,Casa,600000,2,1,80,Jardín,Descripción Y",
      ),
    );

    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].data.title).toBe("Casa Válida");
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].row).toBe(2);
    expect(result.invalid[0].errors.title).toBeDefined();
  });

  it("reports a row with a non-numeric price", () => {
    const result = parsePropertiesCsv(
      csv("Casa Rota,Ubicación,Casa,no-es-un-precio,3,2,100,Jardín,Descripción"),
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors.price).toBeDefined();
  });

  it("numbers rows starting at 2 (the header is row 1)", () => {
    const result = parsePropertiesCsv(
      csv(
        "Casa Uno,Ubicación,Casa,500000,3,2,100,Jardín,Descripción",
        "Casa Dos,Ubicación,Casa,600000,3,2,100,Jardín,Descripción",
        "Casa Tres,Ubicación,Casa,700000,3,2,100,Jardín,Descripción",
      ),
    );

    expect(result.valid.map((r) => r.row)).toEqual([2, 3, 4]);
  });

  it("returns no rows for a CSV with only a header", () => {
    const result = parsePropertiesCsv(HEADER);
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });
});
