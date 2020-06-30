def valid_coloring(
    neighbours, colored_vertices, color,
):
    return not any(
        neighbour == 1 and colored_vertices[i] == color
        for i, neighbour in enumerate(neighbours)
    )
