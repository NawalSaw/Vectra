import vtracer
from pathlib import Path

class Vectorizer:
    def __init__(
        self,
        colormode="color",
        hierarchical="stacked",
        mode="spline",
    ):
        self.defaults = {
            "colormode": colormode,
            "hierarchical": hierarchical,
            "mode": mode,
            "filter_speckle": 4,
            "color_precision": 6,
            "layer_difference": 16,
            "corner_threshold": 60,
            "length_threshold": 4.0,
            "max_iterations": 10,
            "splice_threshold": 45,
            "path_precision": 3,
        }

    def vectorize(
        self,
        input_path: str,
        output_path: str,
        **kwargs
    ) -> str:
        input_path = str(Path(input_path))
        output_path = str(Path(output_path))
        config = {
            **self.defaults,
            **kwargs
        }
        vtracer.convert_image_to_svg_py(
            input_path,
            output_path,
            **config
        )
        return output_path
    
    def vectorize_bytes(
        self,
        input_bytes: bytes,
        **kwargs
    ) -> str:
        config = {
            **self.defaults,
            **kwargs
        }
        svg_str: str = vtracer.convert_raw_image_to_svg(input_bytes, img_format='jpg', **config)
        return svg_str
